const { fetchJson } = require("../../../util/apiClient");

// ---- MediaWiki helpers
const WIKIDATA_API = "https://www.wikidata.org/w/api.php?origin=*";

// 1) Find QID from name
async function fetchWikidataIdByName(name) {
  const url = `${WIKIDATA_API}&action=wbsearchentities&search=${encodeURIComponent(
    name
  )}&language=en&format=json`;
  const data = await fetchJson(url);
  return data?.search?.[0]?.id || null;
}

// 2) Fetch the full entity JSON
async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const data = await fetchJson(url);
  return data?.entities?.[qid];
}

// 3) Batch-resolve QIDs → readable labels (and capture enwiki titles)
async function resolveLabels(qids, lang = "en") {
  const ids = [...new Set(qids.filter(Boolean))];
  if (ids.length === 0) return { labels: {}, enwiki: {} };

  const labels = {};
  const enwiki = {};

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `${WIKIDATA_API}&action=wbgetentities&ids=${batch.join(
      "|"
    )}&props=labels|sitelinks&languages=${lang}&format=json`;
    const data = await fetchJson(url);
    const ents = data?.entities || {};
    for (const id of Object.keys(ents)) {
      const e = ents[id];
      labels[id] = e?.labels?.[lang]?.value || e?.labels?.en?.value || id;
      enwiki[id] = e?.sitelinks?.enwiki?.title || null;
    }
  }
  return { labels, enwiki };
}

// 4) Extractors
const getClaims = (entity, pid) => entity?.claims?.[pid] || [];

function getItemIds(entity, pid) {
  return getClaims(entity, pid)
    .map((c) => c?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function getStrings(entity, pid) {
  return getClaims(entity, pid)
    .map((c) => c?.mainsnak?.datavalue?.value)
    .filter((v) => typeof v === "string");
}

function getFirstTimeString(entity, pid) {
  const c = getClaims(entity, pid)[0];
  const v = c?.mainsnak?.datavalue?.value;
  if (!v?.time) return "";
  // Wikidata time looks like "+1835-11-30T00:00:00Z"
  const t = (v.time || "").replace("+", "");
  const precision = v.precision || 11; // 11=day, 10=month, 9=year
  if (precision >= 11) return t.slice(0, 10); // YYYY-MM-DD
  if (precision === 10) return t.slice(0, 7); // YYYY-MM
  return t.slice(0, 4); // YYYY
}

function fileToCommonsUrl(filename) {
  if (!filename) return "";
  const clean = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    clean
  )}`;
}

// 5) Wikipedia summary by title
async function fetchWikipediaSummaryByTitle(title) {
  if (!title) return "";
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      title
    )}`;
    const data = await fetchJson(url);
    return data?.extract || "";
  } catch {
    return "";
  }
}

// ---- Main endpoint
async function getAuthorFullProfile(req, res) {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ error: "Author name required" });

    const qid = await fetchWikidataIdByName(name);
    if (!qid) return res.status(404).json({ error: "Author not found" });

    const entity = await fetchWikidataEntity(qid);
    if (!entity) return res.status(404).json({ error: "Entity not found" });

    const label = entity?.labels?.en?.value || name;
    const shortDescription = entity?.descriptions?.en?.value || "";

    // Collect all item-valued properties we want to resolve to labels
    const itemPidList = [
      "P735", // given name
      "P734", // family name
      "P106", // occupation
      "P135", // movement
      "P1412", // languages of work/writing
      "P19", // place of birth
      "P20", // place of death
      "P509", // cause of death
      "P21", // gender (item)
      "P27", // country of citizenship
      "P140", // religion
      "P69", // educated at
      "P108", // employer
      "P463", // member of
      "P800", // notable works
      "P527", // has part (bibliography; sometimes used)
      "P166", // awards
      "P737", // influenced by
      "P802", // students
      "P1066", // student of / teacher
      "P26", // spouse
      "P40", // children
      "P1038", // relatives
    ];

    // Extract all QIDs we need to label
    const allQids = new Set();
    for (const pid of itemPidList) {
      getItemIds(entity, pid).forEach((id) => allQids.add(id));
    }

    // Resolve labels & enwiki titles for those QIDs
    const { labels: labelMap } = await resolveLabels([...allQids]);

    // Build fields
    const photo = fileToCommonsUrl(getStrings(entity, "P18")[0] || "");
    const signature = fileToCommonsUrl(getStrings(entity, "P109")[0] || "");

    const givenName = getItemIds(entity, "P735").map((id) => labelMap[id]).filter(Boolean);
    const familyName = getItemIds(entity, "P734").map((id) => labelMap[id]).filter(Boolean);

    const profession = getItemIds(entity, "P106").map((id) => labelMap[id]).filter(Boolean);
    const literaryMovement = getItemIds(entity, "P135").map((id) => labelMap[id]).filter(Boolean);
    const languagesOfWork = getItemIds(entity, "P1412").map((id) => labelMap[id]).filter(Boolean);

    const dateOfBirth = getFirstTimeString(entity, "P569");
    const placeOfBirth = getItemIds(entity, "P19").map((id) => labelMap[id]).filter(Boolean);

    const dateOfDeath = getFirstTimeString(entity, "P570");
    const placeOfDeath = getItemIds(entity, "P20").map((id) => labelMap[id]).filter(Boolean);
    const causeOfDeath = getItemIds(entity, "P509").map((id) => labelMap[id]).filter(Boolean);

    const gender = getItemIds(entity, "P21").map((id) => labelMap[id]).filter(Boolean);
    const citizenship = getItemIds(entity, "P27").map((id) => labelMap[id]).filter(Boolean);
    const religion = getItemIds(entity, "P140").map((id) => labelMap[id]).filter(Boolean);

    const education = getItemIds(entity, "P69").map((id) => labelMap[id]).filter(Boolean);
    const employer = getItemIds(entity, "P108").map((id) => labelMap[id]).filter(Boolean);
    const memberOf = getItemIds(entity, "P463").map((id) => labelMap[id]).filter(Boolean);

    const notableWorks = getItemIds(entity, "P800").map((id) => labelMap[id]).filter(Boolean);
    const bibliography = getItemIds(entity, "P527").map((id) => labelMap[id]).filter(Boolean);
    const awards = getItemIds(entity, "P166").map((id) => labelMap[id]).filter(Boolean);

    const influencedBy = getItemIds(entity, "P737").map((id) => labelMap[id]).filter(Boolean);
    // NOTE: "influenced" inverse often isn't stored directly on the item; needs a reverse query (SPARQL).
    // We’ll leave it empty if not present.
    const influenced = []; // keep for schema consistency

    const students = getItemIds(entity, "P802").map((id) => labelMap[id]).filter(Boolean);
    const teachers = getItemIds(entity, "P1066").map((id) => labelMap[id]).filter(Boolean);
    const spouse = getItemIds(entity, "P26").map((id) => labelMap[id]).filter(Boolean);
    const children = getItemIds(entity, "P40").map((id) => labelMap[id]).filter(Boolean);
    const relatives = getItemIds(entity, "P1038").map((id) => labelMap[id]).filter(Boolean);

    // Social / web
    const website = getStrings(entity, "P856")[0] || "";
    const youtubeId = getStrings(entity, "P2397")[0] || "";
    const facebookId = getStrings(entity, "P2013")[0] || "";
    const xHandle = getStrings(entity, "P2002")[0] || "";
    const instagram = getStrings(entity, "P2003")[0] || "";
    const linkedinId = getStrings(entity, "P6634")[0] || "";

  

    // Wikipedia long summary (if we have enwiki sitelink)
    const enwikiTitle = entity?.sitelinks?.enwiki?.title || null;
    const summary = await fetchWikipediaSummaryByTitle(enwikiTitle || label);

    // Aliases (helpful for display)
    const aliases =
      (entity?.aliases?.en || []).map((a) => a.value).filter(Boolean);

      const data = {
      wikidataId: qid,
      name: label,
      description: shortDescription,
      summary,
      photo,
      signature,
      givenName,
      familyName,
      gender,
      citizenship,
      religion,
      profession,
      literaryMovement,
      languagesOfWork,
      dateOfBirth,
      placeOfBirth,
      dateOfDeath,
      placeOfDeath,
      causeOfDeath,
      education,
      employer,
      memberOf,
      notableWorks,
      bibliography,
      awards,
      influencedBy,
      influenced,
      students,
      teachers,
      spouse,
      children,
      relatives,
      website,
      youtube: youtubeId ? `https://www.youtube.com/channel/${youtubeId}` : "",
      facebook: facebookId ? `https://facebook.com/${facebookId}` : "",
      x: xHandle ? `https://x.com/${xHandle}` : "",
      youtube: youtubeId ? `https://youtube.com/${youtubeId}` : "" ,
      instagram: instagram ? `https://instagram.com/${instagram}` : "",
      linkedin: linkedinId ? `https://www.linkedin.com/in/${linkedinId}` : "",
      aliases,
      }
    // Final JSON (all human-readable)
    res.json({
     data
    });
  } catch (err) {
    console.error("getAuthorFullProfile error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info" });
  }
}

module.exports = { getAuthorFullProfile };
