// controller/book/about/notableWorksController.js

// --- Inline Wikidata helpers ---
async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch entity ${qid}`);
  const data = await res.json();
  return data.entities[qid];
}

async function resolveLabels(ids) {
  if (!ids.length) return { labels: {} };
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join(
    "|"
  )}&props=labels&languages=en&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to resolve labels");
  const data = await res.json();
  const labels = {};
  for (const id of ids) {
    labels[id] = data.entities[id]?.labels?.en?.value || id;
  }
  return { labels };
}

function getItemIds(entity, property) {
  return (
    entity?.claims?.[property]
      ?.map((c) => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean) || []
  );
}

function getStrings(entity, property) {
  return (
    entity?.claims?.[property]
      ?.map((c) => c.mainsnak?.datavalue?.value)
      .filter(Boolean) || []
  );
}

function fileToCommonsUrl(filename) {
  if (!filename) return "";
  const clean = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    clean
  )}`;
}

// --- Gutenberg / OpenLibrary ID helpers ---
function getGutenbergId(entity) {
  return getStrings(entity, "P2034")[0] || "";
}

function getOpenLibraryId(entity) {
  return getStrings(entity, "P648")[0] || "";
}

// --- Fetch cover + IDs for notable works ---
async function fetchBookInfo(qid) {
  const entity = await fetchWikidataEntity(qid);
  if (!entity) return { cover: "", idValue: "" };

  // Prefer book cover (P5775), fallback to general image (P18)
  const cover = getStrings(entity, "P5775")[0] || getStrings(entity, "P18")[0] || "";

  // Gutenberg first, fallback OpenLibrary
  let idValue = getGutenbergId(entity);
  if (!idValue) {
    idValue = getOpenLibraryId(entity);
  }

  return {
    cover: fileToCommonsUrl(cover),
    idValue, // unified field
  };
}

// --- Controller ---
async function getAuthorNotableWorks(req, res) {
  try {
    const { wikiId } = req.params;
    if (!wikiId) return res.status(400).json({ error: "QID required" });

    const entity = await fetchWikidataEntity(wikiId);
    if (!entity) return res.status(404).json({ error: "Entity not found" });

    const workIds = getItemIds(entity, "P800"); // P800 = notable work
    if (!workIds.length) return res.json({ notableWorks: [] });

    const { labels: labelMap } = await resolveLabels(workIds);

    const works = [];
    for (const id of workIds) {
      const { cover, idValue } = await fetchBookInfo(id);
      works.push({
        qid: id,
        name: labelMap[id],
        cover: cover || "assets/img/noCoverFound.png",
        idValue: idValue || null,
      });
    }

    res.json({ notableWorks: works });
  } catch (err) {
    console.error("getAuthorNotableWorks error:", err.message);
    res.status(500).json({ error: "Failed to fetch notable works" });
  }
}

module.exports = { getAuthorNotableWorks };
