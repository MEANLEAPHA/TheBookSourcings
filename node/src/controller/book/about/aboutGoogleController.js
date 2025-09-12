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
      cover: data.volumeInfo.imageLinks?.thumbnail.replace(/^http:/, 'https:') || null,
      categories: data.volumeInfo.categories?data.volumeInfo.categories.map(cat => cat.replace("/", ", ").replace(" / ", ", ").replace(" /", ", ").replace("/ ", ", ")) : [],
      language: data.volumeInfo.language || null,
      page: data.volumeInfo.pageCount || null,
      ISBN_10: identifiers.find(id => id.type === "ISBN_10")?.identifier || null,
      ISBN_13: identifiers.find(id => id.type === "ISBN_13")?.identifier || null,
      publishDate: data.volumeInfo.publishedDate || null,
      publisher: data.volumeInfo.publisher || null,
      read : data.volumeInfo.previewLink?.replace(/^http:/, 'https:'),
      download : data.volumeInfo.previewLink?.replace(/^http:/, 'https:')
    };



    res.json({ book});
  } catch (err) {
    console.error("GoogleBooksController Error:", err.message);
    res.status(500).json({ error: "Failed to fetch book" });
  }
}

module.exports = { getGoogleBookById };
