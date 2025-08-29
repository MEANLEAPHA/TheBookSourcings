// controllers/openLibraryController.js
const { fetchJson } = require("../../../util/apiClient");

async function getOpenLibraryBookById(req, res) {
  try {
    const { bookId } = req.params;

    // Fetch Work data
    const workUrl = `https://openlibrary.org/works/${bookId}.json`;
    const workData = await fetchJson(workUrl);

    if (!workData) {
      return res.status(404).json({
        error: "No data about this Book",
      });
    }

    // Get the first edition key
    let editionData = null;
    try {
      const editionListUrl = `https://openlibrary.org/works/${bookId}/editions.json?limit=1`;
      const editionList = await fetchJson(editionListUrl);

      if (editionList?.entries?.length > 0) {
        const editionKey = editionList.entries[0].key; // e.g. "/books/OL7353617M"
        const editionUrl = `https://openlibrary.org${editionKey}.json`;
        editionData = await fetchJson(editionUrl);
      }
    } catch (err) {
      console.warn("No edition data found for book:", bookId);
    }

    // Extract identifiers (ISBNs, OCLC, etc.)
    const identifiers = editionData?.identifiers || {};

    // Fetch author names
    const authorNames = await Promise.all(
      (workData.authors || []).map(async (a) => {
        const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
        return authorData.name || "Unknown";
      })
    );

    // Build read & download links if ocaid exists
    let read = null;
    let download = null;
    if (editionData?.ocaid) {
      const ocaid = editionData.ocaid;
      read = `https://archive.org/details/${ocaid}`;
      download = `https://archive.org/download/${ocaid}/${ocaid}.pdf`;
    }

    const book = {
      source: "Open Library",
      bookId: workData.key || bookId,
      title: workData.title || null,
      subtitle: editionData?.subtitle || null,
      authors: authorNames,
      description:
        typeof workData.description === "string"
          ? workData.description
          : workData.description?.value || null,
      cover: workData.covers
        ? `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`
        : null,
      categories: workData.subjects || [],
      language: editionData?.languages?.[0]?.key?.replace("/languages/", "") || null,
      page: editionData?.pagination || editionData?.number_of_pages || null,
      ISBN_10: editionData?.isbn_10 ? editionData.isbn_10[0] : null,
      ISBN_13: editionData?.isbn_13 ? editionData.isbn_13[0] : null,
      publishDate: editionData?.publish_date || null,
      publisher: editionData?.publishers ? editionData.publishers[0] : null,
      read,
      download,
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
