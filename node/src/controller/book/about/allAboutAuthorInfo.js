const { getAuthorNameGoogleBook } = require("./aboutAuthorGoogleController");
const { getAuthorNameGUT } = require("./aboutAuthorGutenbergController");
const { getAuthorNameOpenLibrary } = require("./aboutAuthorOpenLibraryController");
const { fetchJson } = require("../../../util/apiClient");

// Helper: fetch Wikidata info for a given author name
async function fetchWikidataForAuthor(authorName) {
  try {
    // Step 1: Search author in OpenLibrary to get Wikidata ID
    const searchUrl = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(authorName)}`;
    const searchData = await fetchJson(searchUrl);

    if (!searchData || !searchData.docs || searchData.docs.length === 0) {
      return { name: authorName, wikidata: null, description: "No author found in OpenLibrary" };
    }

    const author = searchData.docs[0];
    const wikidataId = author.wikidata;

    if (!wikidataId) {
      return { name: authorName, wikidata: null, description: "No Wikidata link available" };
    }

    // Step 2: Fetch Wikidata entity description
    const wikidataUrl = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
    const wikidataData = await fetchJson(wikidataUrl);

    const entity = wikidataData.entities[wikidataId];
    const description =
      entity.descriptions?.en?.value ||
      entity.labels?.en?.value ||
      "No description available";

    return {
      name: authorName,
      wikidataId,
      description,
    };
  } catch (err) {
    console.error("fetchWikidataForAuthor error:", err.message);
    return { name: authorName, wikidata: null, description: "Error fetching Wikidata" };
  }
}

// Main endpoint: one call → bookId → authorNames → Wikidata info
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

    if (authorNames.length === 0) {
      return res.status(404).json({ error: "No authors found for this book" });
    }

    // Now enrich each author with Wikidata info
    const results = await Promise.all(
      authorNames.map((name) => fetchWikidataForAuthor(name))
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
