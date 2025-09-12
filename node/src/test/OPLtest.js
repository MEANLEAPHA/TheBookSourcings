// controllers/openLibraryController.js
const { fetchJson } = require("../../../util/apiClient");

async function getOpenLibraryBookById(req, res) {
  try {
    const { bookId } = req.params;

    // Open Library API: Example - https://openlibrary.org/works/OL45883W.json
    const url = `https://openlibrary.org/works/${bookId}.json`;
    const data = await fetchJson(url);

    if (!data) {
      return res.status(404).json({
        error: "No data about this Book",
      });
    }

    // Try to fetch editions (for ISBNs, page count, publisher, publish date)
    let editionData = null;
    try {
      const editionUrl = `https://openlibrary.org/works/${bookId}/editions.json?limit=1`;
      const editionResponse = await fetchJson(editionUrl);
      if (editionResponse && editionResponse.entries && editionResponse.entries.length > 0) {
        editionData = editionResponse.entries[0];
      }
    } catch (err) {
      console.warn("No edition data found for book:", bookId);
    }

    // Extract identifiers (ISBNs, OCLC, LCCN, etc.)
    const identifiers = editionData?.identifiers || {};
    const authorNames = await Promise.all(
        (data.authors || []).map(async (a) => {
          const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
          return authorData.name || "Unknown";
        })
      );


    const book = {
      source: "Open Library",
      bookId: data.key || bookId,
      title: data.title || null,
      subtitle: editionData?.subtitle || null,
      authors: authorNames,
      description:
        typeof data.description === "string"
          ? data.description
          : data.description?.value || null,
      cover: data.covers
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : null,
      categories: data.subjects || [],
      language: editionData?.languages?.[0]?.key?.replace("/languages/", "") || null,
      page: editionData?.pagination || null,
      ISBN_10: editionData.isbn_10 ? editionData.isbn_10[0] : null,
      ISBN_13: editionData.isbn_13 ? editionData.isbn_13[0] : null,
      publishDate: editionData?.publish_date || null,
      publisher: editionData?.publishers ? editionData.publishers[0] : null,
   
    };

    res.json(book);
  } catch (err) {
    console.error("openLibraryController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book data",
      status: false,
    });
  }
}

module.exports = { getOpenLibraryBookById };
