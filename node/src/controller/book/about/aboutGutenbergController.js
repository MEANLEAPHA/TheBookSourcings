const { fetchJson } = require("../../../util/apiClient");

async function getGutenbergBookById(req, res) {
  try {
    const { bookId } = req.params;
    const url = `https://gutendex.com/books/${bookId}`;
    const data = await fetchJson(url);

    if (!data || !data.id) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    // Format authors as "First Last"
    const authorsArray = data.authors?.map(a => a.name) || [];
    const authors = authorsArray
      .map(name => {
        if (name.includes(",")) {
          const [last, first] = name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : name;
        }
        return name;
      })
      .join(", ") || "Unknown";

    // Base book (from Gutenberg)
    let book = {
      source: "Project Gutenberg",
      bookId: data.id || null,
      title: data.title || null,
      subtitle: null,
      authors,
      description: data.summaries?.[0] || null,
      cover: data.formats?.["image/jpeg"] || null,
      categories: data.subjects || [],
      language: data.languages?.[0] || null,
      page: null,
      ISBN_10: null,
      ISBN_13: null,
      publishDate: data?.copyright || null,
      publisher: null,
      read: data.formats?.["text/html"] || null,
      download: data.formats?.["application/epub+zip"] || null,
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
    console.error("aboutGutenbergController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

module.exports = { getGutenbergBookById };
