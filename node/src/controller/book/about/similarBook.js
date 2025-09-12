const { fetchJson } = require("../../../util/apiClient");


// Controller: Get similar books from 3 sources
async function getSimilarBooks (req, res){
 // Instead of req.query
const category = req.params.category; // from /similar/:category




  if (!category) return res.status(400).json({ error: "Category is required" });

  let similarBooks = [];

  try {
    // --- OpenLibrary by subject ---
    const olUrl = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=5`;
    const olSimilar = await fetchJson(olUrl);

    if (olSimilar?.works) {
      similarBooks.push(
        ...olSimilar.works.map((w) => {
          let cover = null;
          if (w.cover_id) {
            cover = `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`;
          } else if (w.cover_edition_key) {
            cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
          }

          return {
            title: w.title,
            bookId: w.key.replace("/works/", ""),
            cover,
            author: w.authors?.[0]?.name || "Unknown",
            source: "Open Library",
          };
        })
      );
    }


    // --- Google Books by subject ---
    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(category)}&maxResults=5&key=AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY`;
    const gSimilar = await fetchJson(gUrl);

    if (gSimilar?.items) {
      similarBooks.push(
        ...gSimilar.items.map((item) => ({
          title: item.volumeInfo?.title || "No title",
          bookId: item.id,
          cover: item.volumeInfo?.imageLinks?.thumbnail.replace(/^http:/, 'https:') || null,
          author: item.volumeInfo?.authors?.[0] || "Unknown",
          source: "Google Books",
        }))
      );
    }

    // --- Project Gutenberg by topic ---
    const gutUrl = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&page=1`;
    const gutSimilar = await fetchJson(gutUrl);

    if (gutSimilar?.results) {
      similarBooks.push(
        ...gutSimilar.results.slice(0, 5).map((b) => ({
          title: b.title,
          bookId: b.id,
          cover: b.formats?.["image/jpeg"] || null,
          author: b.authors?.[0]?.name || "Unknown",
          source: "Project Gutenberg",
        }))
      );
    }

    res.json({ category, results: similarBooks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { getSimilarBooks };