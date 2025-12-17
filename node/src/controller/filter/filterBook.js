const { fetchJson } = require("../../../util/apiClient");
const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const isBookQid = q.includes("_") || q.startsWith("OL") || /^\d+$/.test(q);
    let results = [];

    // 1️⃣ Otthor (priority)
    const otthor = await searchOtthor(q, isBookQid);
    results.push(...otthor);

    if (isBookQid && otthor.length) {
      return res.json(results.slice(0, 20));
    }

    // Parallel external search
    const [google, openlib, gutenberg] = await Promise.all([
      searchGoogle(q),
      searchOpenLibrary(q),
      searchGutenberg(q),
    ]);

    results.push(...google, ...openlib, ...gutenberg);

    res.json(results.slice(0, 20));
  } catch (err) {
    console.error("searchBooks error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
async function searchOtthor(q, isBookQid) {
  const sql = isBookQid
    ? `SELECT bookQid, title, author, summary, bookCover 
       FROM uploadBook WHERE bookQid = ?`
    : `SELECT bookQid, title, author, summary, bookCover 
       FROM uploadBook WHERE title LIKE ? LIMIT 5`;

  const [rows] = await db.query(
    sql,
    isBookQid ? [q] : [`%${q}%`]
  );

  return rows.map(b => ({
    bookQid: b.bookQid,
    title: b.title,
    authors: b.author ? b.author.split(",").map(a => a.trim()) : [],
    description: b.summary || null,
    cover: b.bookCover || null,
    source: "otthor"
  }));
}
async function searchGoogle(q) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(q)}&maxResults=5`;
     const data = await fetchJson(url);

  if (!data.items) return [];

  return data.items.map(b => ({
    bookQid: b.id,
    title: b.volumeInfo.title,
    authors: b.volumeInfo.authors || [],
    description: b.volumeInfo.description || null,
    cover: b.volumeInfo.imageLinks?.thumbnail?.replace(/^http:/, "https:") || null,
    source: "google"
  }));
}


async function searchOpenLibrary(q) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=5`;
     const data = await fetchJson(url);

  return data.docs.map(b => ({
    bookQid: b.key.replace("/works/", ""),
    title: b.title,
    authors: b.author_name || [],
    description: null,
    cover: b.cover_i
      ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
      : null,
    source: "openlibrary"
  }));
}

async function searchGutenberg(q) {
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(q)}`;
     const data = await fetchJson(url);

  return data.results.slice(0, 5).map(b => ({
    bookQid: b.id,
    title: b.title,
    authors: b.authors.map(a => a.name),
    description: b.summaries?.[0] || null,
    cover: b.formats?.["image/jpeg"] || null,
    source: "gutenberg"
  }));
}

module.exports = { searchBooks };