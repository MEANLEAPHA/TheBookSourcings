// src/controller/book/about/similarAuthorController.js

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const WIKIDATA_SEARCH = "https://www.wikidata.org/w/api.php";

// Step 1: Resolve a profession word → Wikidata QID
async function resolveProfessionToQid(profession) {
  const url = `${WIKIDATA_SEARCH}?action=wbsearchentities&language=en&format=json&type=item&search=${encodeURIComponent(profession)}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "TheBookSourcings/1.0 (https://thebooksourcings.onrender.com; contact@thebooksourcings.com)" }
  });

  if (!response.ok) throw new Error(`Wikidata search failed: ${response.status}`);

  const data = await response.json();

  if (data.search && data.search.length > 0) {
    return data.search[0].id; // take the first match (e.g. "Q4964182")
  }
  return null;
}

// Step 2: Main controller
async function findAuthorsWithProfession(req, res) {
  try {
    const { profession } = req.params;

    if (!profession) {
      return res.status(400).json({ error: "Profession parameter is required" });
    }

    // Resolve profession → QID
    const professionQid = await resolveProfessionToQid(profession);
    if (!professionQid) {
      return res.status(404).json({ error: `No QID found for profession: ${profession}` });
    }

    

    // SPARQL query: must be author + have the given profession
    const query = `
      SELECT ?person ?personLabel ?image WHERE {
        ?person wdt:P106 wd:Q36180.        # author
        ?person wdt:P106 wd:${professionQid}. # secondary profession
        OPTIONAL { ?person wdt:P18 ?image }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 6
    `;

    const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}&format=json`;

    const response = await fetch(url, {
      headers: { "User-Agent": "TheBookSourcings/1.0 (https://thebooksourcings.onrender.com; contact@thebooksourcings.com)" }
    });

    if (!response.ok) throw new Error(`SPARQL query failed: ${response.status}`);

    const data = await response.json();

    if (!data.results || !data.results.bindings) {
      throw new Error("SPARQL returned no results or invalid response");
    }

    const results = data.results.bindings.map(item => ({
      qid: item.person.value.split("/").pop(),
      name: item.personLabel?.value || "Unknown",
      photo: item.image?.value || null
    }));

    return res.json({ profession, professionQid, authors: results });
  } catch (error) {
    console.error("Error in findAuthorsWithProfession:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}

module.exports = { findAuthorsWithProfession };
