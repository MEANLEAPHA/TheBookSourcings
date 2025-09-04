const { fetchJson } = require("../../../util/apiClient");

// Controller: Get similar books from 3 sources
async function bookByAuthor(req, res) {
  const authorName = req.params.authorName;

  if (!authorName) return res.status(400).json({ error: "authorName is required" });

  let authorBooks = [];

  try {
    // --- OpenLibrary ---
    const olUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName.toLowerCase())}&limit=3`;
    const olSimilar = await fetchJson(olUrl);

    if (olSimilar?.docs) {
      authorBooks.push(
        ...olSimilar.docs.slice(0, 3).map((w) => {
          let cover = null;
          if (w.cover_i) {
            cover = `https://covers.openlibrary.org/b/id/${w.cover_i}-L.jpg`;
          } else if (w.cover_edition_key) {
            cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
          }

          return {
            title: w.title,
            bookId: w.key.replace("/works/", ""),
            cover,
            author: w.author_name?.join(", ") || null,
            source: "Open Library",
          };
        })
      );
    }

    // --- Google Books ---
    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(authorName.toLowerCase())}&maxResults=3&key=AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY`;
    const gSimilar = await fetchJson(gUrl);
    if (gSimilar?.items) {
      authorBooks.push(
        ...gSimilar.items.slice(0, 3).map((item) => ({
          title: item.volumeInfo?.title || "No title",
          bookId: item.id,
          cover: item.volumeInfo?.imageLinks?.thumbnail || null,
          author: item.volumeInfo?.authors?.join(", ") || null,
          source: "Google Books",
        }))
      );
    }

    // --- Project Gutenberg (only first page, up to 3 results) ---
    const gutUrl = `https://gutendex.com/books?search=${encodeURIComponent(authorName)}`;
    const gutSimilar = await fetchJson(gutUrl);

    if (gutSimilar?.results) {
      const gutBooks = gutSimilar.results
        .filter((b) =>
          b.authors.some((a) =>
            a.name.toLowerCase().includes(authorName.toLowerCase())
          )
        )
        .slice(0, 3)
        .map((b) => ({
          title: b.title,
          bookId: b.id,
          cover: b.formats?.["image/jpeg"] || null,
          author: b.authors?.map((a) => a.name).join(", ") || null,
          source: "Project Gutenberg",
        }));

      authorBooks.push(...gutBooks);
    }

    // Return all sources combined
    res.json({
      authorName,
      results: authorBooks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { bookByAuthor };
