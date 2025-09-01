// controllers/openLibraryController.js
const { fetchJson } = require("../../../util/apiClient");

async function getOpenLibraryBookById(req, res) {
  try {
    const { bookId } = req.params;

    // 1. Fetch Work data
    const workUrl = `https://openlibrary.org/works/${bookId}.json`;
    const workData = await fetchJson(workUrl);

    if (!workData) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    // 2. Get first edition key from editions list
    let editionData = null;
    let editionKey = null;
    try {
      const editionListUrl = `https://openlibrary.org/works/${bookId}/editions.json?limit=1`;
      const editionList = await fetchJson(editionListUrl);

      if (editionList?.entries?.length > 0) {
        editionKey = editionList.entries[0].key; // "/books/OL57459421M"
        const editionId = editionKey.replace("/books/", "");
        const editionUrl = `https://openlibrary.org/books/${editionId}.json`;
        editionData = await fetchJson(editionUrl);
      }
    } catch (err) {
      console.warn("No edition data found for work:", bookId);
    }

    // 3. Fetch author names
    const authorNames = await Promise.all(
      (workData.authors || []).map(async (a) => {
        const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
        return authorData.name || "Unknown";
      })
    );

    // 4. Build read & download links
    let read = null;
    let download = null;

    if (editionData?.ocaid) {
      const ocaid = editionData.ocaid;
      read = `https://archive.org/details/${ocaid}`;
      download = `https://archive.org/download/${ocaid}/${ocaid}.pdf`;
    } else if (editionData?.ebooks?.length > 0) {
      const ebook = editionData.ebooks[0];
      if (ebook?.preview_url) read = ebook.preview_url;
      if (ebook?.formats?.pdf) download = ebook.formats.pdf;
    }

        let cover = null;

    // Try work cover first
    if (workData?.covers?.length > 0) {
      cover = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
    }
    // If no work cover, try edition cover
    else if (editionList?.entries?.[0]?.covers?.length > 0) {
      cover = `https://covers.openlibrary.org/b/id/${editionList.entries[0].covers[0]}-L.jpg`;
    }
    // Else leave it null, or point to a placeholder
    else {
      cover = "/images/placeholder.jpg"; // optional
    }

    // 5. Build response
    const book = {
      source: "Open Library",
      workUrl: `https://openlibrary.org/works/${bookId}`,
      editionUrl: editionKey ? `https://openlibrary.org${editionKey}` : null,
      bookId: workData.key || bookId,
      title: workData.title || null,
      subtitle: editionData?.subtitle || null,
      authors: authorNames,
      description:
        typeof workData.description === "string"
          ? workData.description
          : workData.description?.value || null,
      cover,
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

 // --- Fetch Similar Books (from all 3 sources) ---
    let similarBooks = [];

    if (book.categories.length) {
      const category = encodeURIComponent(book.categories[0]);

      // OpenLibrary by subject
      const olSimilar = await fetchJson(`https://openlibrary.org/subjects/${category.toLowerCase()}.json?limit=5`);
      if (olSimilar?.works) {
        similarBooks.push(
          ...olSimilar.works.map(w => ({
            title: w.title,
            bookId: w.key.replace("/works/", ""),
            cover: w.covers?.[0] ? `https://covers.openlibrary.org/b/id/${w.covers[0]}-L.jpg` : null,
            author: w.authors?.[0]?.name || "Unknown",
            source: "Open Library",
          }))
        );
      }

      // Google Books by subject
      const gSimilar = await fetchJson(`https://www.googleapis.com/books/v1/volumes?q=subject:${category}&maxResults=5`);
      if (gSimilar?.items) {
        similarBooks.push(
          ...gSimilar.items.map(item => ({
            title: item.volumeInfo?.title || "No title",
            bookId: item.id,
            cover: item.volumeInfo?.imageLinks?.thumbnail || null,
            author: item.volumeInfo?.authors?.[0] || "Unknown",
            source: "Google Books",
          }))
        );
      }

      // Gutenberg by topic
      const gutSimilar = await fetchJson(`https://gutendex.com/books?topic=${category}&page=1`);
      if (gutSimilar?.results) {
        similarBooks.push(
          ...gutSimilar.results.slice(0, 5).map(b => ({
            title: b.title,
            bookId: b.id,
            cover: b.formats?.["image/jpeg"] || null,
            author: b.authors?.[0]?.name || "Unknown",
            source: "Project Gutenberg",
          }))
        );
      }
    }

    res.json({ book, similarBooks });
  } catch (err) {
    console.error("openLibraryController.js Error:", err.message);
    return res.status(500).json({
      error: "Failed to fetch the book data",
      status: false,
    });
  }
}

module.exports = { getOpenLibraryBookById };
