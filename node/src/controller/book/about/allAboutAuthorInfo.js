const { fetchJson } = require("../../../util/apiClient");

const db = require("../../../config/db");


async function getAuthorInfoByQid(req, res) {
  try {
    const {authorQid} = req.params;
    if (!authorQid) {
      return res.status(400).json({ error: "Author QID required" });
    }

    // Split QIDs (example: "Q123,Q456,Q789")
    const authorQids = authorQid.split(",");

    // Make SQL placeholders: (?, ?, ?, ...)
    const placeholders = authorQids.map(() => "?").join(",");

    // Query DB
    const [rows] = await db.query(
      `SELECT *
       FROM users 
       WHERE authorQid IN (${placeholders})`,
      authorQids
    );

    // If no authors found
    if (!rows || rows.length === 0) {
      return res.json({ authors: [] });
    }

    // Return in frontend-compatible format
    res.json({ authors: rows });
  } catch (err) {
    console.error("getAuthorInfoByQid error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info by QID" });
  }
};




// --- Search Wikidata by author name
async function fetchWikidataId(name) {
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&origin=*`;
  const data = await fetchJson(searchUrl);
  if (data.search && data.search.length > 0) return data.search[0].id;
  return null;
}

// --- Fetch Wikidata entity by QID
async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const data = await fetchJson(url);
  return data.entities[qid];
}

// --- Get label (human-readable) for a Wikidata QID
async function fetchWikidataLabel(qid) {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const data = await fetchJson(url);
    return data.entities[qid]?.labels?.en?.value || qid; // fallback to QID if no label
  } catch (err) {
    console.error("fetchWikidataLabel error:", err.message);
    return qid;
  }
}

// --- Main controller
async function getAuthorInfo(req, res) {
  try {
    const authorNamesParam = req.params.authorNames;
    if (!authorNamesParam) return res.status(400).json({ error: "Author names required" });

    const authorNames = authorNamesParam.split(",");

    const results = await Promise.all(
      authorNames.map(async (name) => {
        let wikidataId = await fetchWikidataId(name);
        let description = "No description available";
        let profession = "";
        let photo = "";

        if (wikidataId) {
          try {
            const entity = await fetchWikidataEntity(wikidataId);
            description = entity.descriptions?.en?.value || entity.labels?.en?.value || description;

            // Profession (P106) → can be array of items
            if (entity.claims?.P106 && entity.claims.P106.length > 0) {
              const professionQid = entity.claims.P106[0].mainsnak.datavalue.value.id;
              profession = await fetchWikidataLabel(professionQid); // 🔹 convert QID → label
            }

            // Image (P18)
            if (entity.claims?.P18 && entity.claims.P18.length > 0) {
              photo = entity.claims.P18[0].mainsnak.datavalue.value || "";
            }
          } catch (err) {
            console.error(`Wikidata fetch error for ${name}:`, err.message);
          }
        }

        return { name, description, profession, photo, wikidataId: wikidataId || "" };
      })
    );

    res.json({ authors: results });
  } catch (err) {
    console.error("getAuthorInfo error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info" });
  }
}

module.exports = { getAuthorInfo, getAuthorInfoByQid };
