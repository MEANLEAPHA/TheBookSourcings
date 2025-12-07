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
          cover: item.volumeInfo?.imageLinks?.thumbnail.replace(/^http:/, 'https:') || null,
          author: item.volumeInfo?.authors?.join(", ") || null,
          source: "Google Books",
        }))
      );
    }

   

    const gutUrl = `https://gutendex.com/books?search=${encodeURIComponent(authorName)}`;
    const gutSimilar = await fetchJson(gutUrl);

    if (gutSimilar?.results) {
       authorBooks.push(
        ...gutSimilar.results.slice(0, 3).map((b) => ({
          title: b.title,
          bookId: b.id,
          cover: b.formats?.["image/jpeg"] || null,
          author: b.authors?.map((a) => a.name).join(", ") || null,
          source: "Project Gutenberg",
        }))
      );
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
async function bookByAuthorByQid(req, res) {
  try {
    const { authorQid } = req.params;
    if (!authorQid) {
      return res.status(400).json({ error: "Author QID required" });
    }

    const authorQids = authorQid.split(",");
    const placeholders = authorQids.map(() => "?").join(",");

    const [rows] = await db.query(
      `SELECT 
         b.bookQid AS bookQid, 
         b.bookCover AS bookCover, 
         b.title AS title, 
         b.subTitle AS subTitle, 
         b.author AS author, 
         u.authorQid,
         u.username,
         u.memberQid
       FROM uploadBook b
       JOIN users u ON b.authorId = u.authorQid
       WHERE u.authorQid IN (${placeholders})
       ORDER BY b.UploadAt DESC`,
      authorQids
    );

    return res.json({ authors: rows });
  } catch (err) {
    console.error("bookByAuthorByQid error:", err.message);
    res.status(500).json({ error: "Failed to fetch books by author QID" });
  }
}




module.exports = { bookByAuthor, bookByAuthorByQid };
