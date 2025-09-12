const { fetchJson } = require("../../../util/apiClient");

const WIKIDATA_API = "https://www.wikidata.org/w/api.php?origin=*";

// --- Fetch entity by QID
async function fetchWikidataEntity(wikiId) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${wikiId}.json`;
  const data = await fetchJson(url);
  return data?.entities?.[wikiId]; // ✅ use wikiId
}

// --- Batch resolve QIDs to labels and photos
async function resolveLabels(qids, lang = "en") {
  const ids = [...new Set(qids.filter(Boolean))];
  if (ids.length === 0) return { labels: {}, enwiki: {}, photos: {} };

  const labels = {};
  const enwiki = {};
  const photos = {};

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `${WIKIDATA_API}&action=wbgetentities&ids=${batch.join(
      "|"
    )}&props=labels|sitelinks|claims&languages=${lang}&format=json`;
    const data = await fetchJson(url);
    const ents = data?.entities || {};
    for (const id of Object.keys(ents)) {
      const e = ents[id];
      labels[id] = e?.labels?.[lang]?.value || e?.labels?.en?.value || id;
      enwiki[id] = e?.sitelinks?.enwiki?.title || null;

      // photo (P18)
      const photoClaim = e?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (photoClaim) {
        photos[id] = fileToCommonsUrl(photoClaim);
      } else {
        photos[id] = null;
      }
    }
  }
  return { labels, enwiki, photos };
}

// --- Helpers
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
  const t = (v.time || "").replace("+", "");
  const precision = v.precision || 11;
  if (precision >= 11) return t.slice(0, 10); // YYYY-MM-DD
  if (precision === 10) return t.slice(0, 7); // YYYY-MM
  return t.slice(0, 4);
}

// --- Commons image URL (direct, usable in <img src>)
function fileToCommonsUrl(filename) {
  if (!filename) return "";
  const clean = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}`;
}

// --- Wikipedia summary
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

// --- Main controller
async function getAuthorFullProfile(req, res) {
  try {
    const { wikiId } = req.params;
    if (!wikiId) return res.status(400).json({ error: "QID required" });

    const entity = await fetchWikidataEntity(wikiId);
    if (!entity) return res.status(404).json({ error: "Entity not found" });

    const label = entity?.labels?.en?.value || wikiId;
    const shortDescription = entity?.descriptions?.en?.value || "";

    const itemPidList = [
      "P735","P734","P106","P135","P1412","P19","P20","P509","P21",
      "P27","P140","P69","P108","P463","P800","P527","P166","P737",
      "P802","P1066","P26","P40","P1038"
    ];

    const allQids = new Set();
    for (const pid of itemPidList) {
      getItemIds(entity, pid).forEach((id) => allQids.add(id));
    }

    const { labels: labelMap, photos: photoMap } = await resolveLabels([...allQids]);

    // --- Fields
    const photo = fileToCommonsUrl(getStrings(entity, "P18")[0] || "");
    const signature = fileToCommonsUrl(getStrings(entity, "P109")[0] || "");

    const givenName = getItemIds(entity, "P735").map((id) => labelMap[id]);
    const familyName = getItemIds(entity, "P734").map((id) => labelMap[id]);
    const profession = getItemIds(entity, "P106").map((id) => labelMap[id]);
    const dateOfBirth = getFirstTimeString(entity, "P569");
    const placeOfBirth = getItemIds(entity, "P19").map((id) => labelMap[id]);
    const dateOfDeath = getFirstTimeString(entity, "P570");
    const placeOfDeath = getItemIds(entity, "P20").map((id) => labelMap[id]);
    const causeOfDeath = getItemIds(entity, "P509").map((id) => labelMap[id]);
    const gender = getItemIds(entity, "P21").map((id) => labelMap[id]);
    const citizenship = getItemIds(entity, "P27").map((id) => labelMap[id]);
    const religion = getItemIds(entity, "P140").map((id) => labelMap[id]);
    const education = getItemIds(entity, "P69").map((id) => labelMap[id]);

    // ✅ notable works with QID + name
    const notableWorks = getItemIds(entity, "P800").map((id) => ({
      qid: id,
      name: labelMap[id],
    }));

    const awards = getItemIds(entity, "P166").map((id) => labelMap[id]);

    // ✅ influencedBy with QID + name + photo
    const influencedBy = getItemIds(entity, "P737").map((id) => ({
      qid: id,
      name: labelMap[id],
      photo: photoMap[id] || "",
    }));

    // ✅ influenced with QID + name + photo
    const influenced = getItemIds(entity, "P802").map((id) => ({
      qid: id,
      name: labelMap[id],
      photo: photoMap[id] || "",
    }));

    // Social
    const website = getStrings(entity, "P856")[0] || "";
    const youtubeId = getStrings(entity, "P2397")[0] || "";
    const facebookId = getStrings(entity, "P2013")[0] || "";
    const xHandle = getStrings(entity, "P2002")[0] || "";
    const instagram = getStrings(entity, "P2003")[0] || "";
    const linkedinId = getStrings(entity, "P6634")[0] || "";

    // Wikipedia
    const enwikiTitle = entity?.sitelinks?.enwiki?.title || null;
    const summary = await fetchWikipediaSummaryByTitle(enwikiTitle || label);
    const aliases = (entity?.aliases?.en || []).map((a) => a.value);

    // Response
    res.json({
      data: {
        wikidataId: wikiId,
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
        dateOfBirth,
        placeOfBirth,
        dateOfDeath,
        placeOfDeath,
        causeOfDeath,
        education,
        notableWorks,   // ✅ updated
        awards,
        influencedBy,   // ✅ updated
        influenced,     // ✅ updated
        website,
        youtube: youtubeId ? `https://www.youtube.com/channel/${youtubeId}` : "",
        facebook: facebookId ? `https://facebook.com/${facebookId}` : "",
        x: xHandle ? `https://x.com/${xHandle}` : "",
        instagram: instagram ? `https://instagram.com/${instagram}` : "",
        linkedin: linkedinId ? `https://www.linkedin.com/in/${linkedinId}` : "",
        aliases,
      },
    });
  } catch (err) {
    console.error("getAuthorFullProfile error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info" });
  }
}

module.exports = { getAuthorFullProfile };
