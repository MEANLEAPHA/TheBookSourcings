// src/controller/book/about/similarAuthorController.js

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";

// Main controller: expects professionQid directly in params
async function findAuthorsWithProfession(req, res) {
  try {
    const { professionQid } = req.params;

    if (!professionQid) {
      return res.status(400).json({ error: "Profession QID is required" });
    }

    // SPARQL query: must be author (Q36180) + given profession QID
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
      headers: {
        "User-Agent": "TheBookSourcings/1.0 (https://thebooksourcings.onrender.com; contact@thebooksourcings.com)"
      }
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

    return res.json({ professionQid, authors: results });
  } catch (error) {
    console.error("Error in findAuthorsWithProfession:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}

module.exports = { findAuthorsWithProfession };
