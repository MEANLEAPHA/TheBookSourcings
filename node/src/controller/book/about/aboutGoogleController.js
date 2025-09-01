const { fetchJson } = require('../../../util/apiClient');

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY";

async function getGoogleBookById(req, res) {
  try {
    const { bookId } = req.params;
    const url = `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${API_KEY}`;
    const data = await fetchJson(url);

    if (!data || !data.volumeInfo) {
      return res.status(404).json({ error: "Book not found" });
    }

    const identifiers = data.volumeInfo.industryIdentifiers || [];

    const book = {
      source: "Google Books",
      bookId: data.id,
      title: data.volumeInfo.title,
      subtitle: data.volumeInfo.subtitle || null,
      authors: data.volumeInfo.authors || [],
      description: data.volumeInfo.description
      ?.replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "") || null,
      cover: data.volumeInfo.imageLinks?.thumbnail || null,
      categories: data.volumeInfo.categories || [],
      language: data.volumeInfo.language || null,
      page: data.volumeInfo.pageCount || null,
      ISBN_10: identifiers.find(id => id.type === "ISBN_10")?.identifier || null,
      ISBN_13: identifiers.find(id => id.type === "ISBN_13")?.identifier || null,
      publishDate: data.volumeInfo.publishedDate || null,
      publisher: data.volumeInfo.publisher || null,
      read : data.volumeInfo.previewLink,
      download : data.volumeInfo.previewLink
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
    console.error("GoogleBooksController Error:", err.message);
    res.status(500).json({ error: "Failed to fetch book" });
  }
}

module.exports = { getGoogleBookById };
