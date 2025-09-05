const { getAuthorNameGoogleBook } = require("./aboutAuthorGoogleController");
const { getAuthorNameGUT } = require("./aboutAuthorGutenbergController");
const { getAuthorNameOpenLibrary } = require("./aboutAuthorOpenLibraryController");
const { fetchJson } = require("../../../util/apiClient");

// Helper: fetch author details including image, profession, and description
async function fetchAuthorDetails(authorName) {
  try {
    // Step 1: Search author in OpenLibrary
    const searchUrl = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}`;
    const searchData = await fetchJson(searchUrl);

    if (!searchData?.docs?.length) {
      return {
        name: authorName,
        wikidataId: null,
        description: "No author found in OpenLibrary",
        image: null,
        profession: null,
      };
    }

    const author = searchData.docs[0];
    const wikidataId = author.wikidata || null;

    // Step 2: Get description from Wikidata if available
    let description = "No description available";
    let profession = author.type || null;
    if (wikidataId) {
      try {
        const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
        const wikidataData = await fetchJson(wikidataUrl);
        const entity = wikidataData.entities[wikidataId];

        description =
          entity.descriptions?.en?.value ||
          entity.labels?.en?.value ||
          description;

        // Try to extract occupation/profession
        if (entity.claims?.P106) {
          // P106 = occupation
          const occupations = entity.claims.P106.map((occ) => occ?.mainsnak?.datavalue?.value?.id).filter(Boolean);
          profession = occupations.join(", ") || profession;
        }
      } catch (err) {
        console.warn("Wikidata fetch failed for author:", authorName);
      }
    }

    // Step 3: Get author image from OpenLibrary (if exists)
    let image = null;
    if (author.key) {
      // OpenLibrary author covers: https://covers.openlibrary.org/a/olid/{OLID}-M.jpg
      image = `https://covers.openlibrary.org/a/olid/${author.key.replace("/authors/", "")}-M.jpg`;
    }

    return {
      name: authorName,
      wikidataId,
      description,
      profession,
      image,
    };
  } catch (err) {
    console.error("fetchAuthorDetails error:", err.message);
    return {
      name: authorName,
      wikidataId: null,
      description: "Error fetching author details",
      image: null,
      profession: null,
    };
  }
}

// Main endpoint: one call → bookId → authorNames → full author info
async function getFullAuthorInfo(req, res) {
  try {
    const { source, bookId } = req.params;

    let authorNames = [];

    if (source === "google") {
      const data = await getAuthorNameGoogleBook(bookId);
      authorNames = data.authorNames || [];
    } else if (source === "gutenberg") {
      const data = await getAuthorNameGUT(bookId);
      authorNames = data.authorNames || [];
    } else if (source === "openlibrary") {
      const data = await getAuthorNameOpenLibrary(bookId);
      authorNames = data.authorNames || [];
    } else {
      return res.status(400).json({ error: "Invalid source" });
    }

    if (!authorNames.length) {
      return res.status(404).json({ error: "No authors found for this book" });
    }

    const results = await Promise.all(
      authorNames.map((name) => fetchAuthorDetails(name))
    );

    res.json({ authors: results });
  } catch (err) {
    console.error("getFullAuthorInfo error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info" });
  }
}

module.exports = {
  getFullAuthorInfo,
};
