const { fetchJson } = require("../../util/apiClient");
const db = require("../../config/db");
// const searchBooks = async (req, res) => {
//   try {
//     const { q } = req.query;
//     if (!q) return res.json([]);

//     const isBookQid = q.includes("_") || q.startsWith("OL") || /^\d+$/.test(q);
//     let results = [];

//     // 1️⃣ Otthor (priority)
//     const otthor = await searchOtthor(q, isBookQid);
//     results.push(...otthor);

//     if (isBookQid && otthor.length) {
//       return res.json(results.slice(0, 20));
//     }

//     // Parallel external search
//     const [google, openlib, gutenberg] = await Promise.all([
//       searchGoogle(q),
//       searchOpenLibrary(q),
//       searchGutenberg(q),
//     ]);

//     results.push(...google, ...openlib, ...gutenberg);

//     res.json(results.slice(0, 20));
//   } catch (err) {
//     console.error("searchBooks error:", err);
//     res.status(500).json({ error: "Search failed" });
//   }
// };
function detectSourceByBookId(bookId) {
  if (/^TB\d+S$/.test(bookId)) return "otthor";
  if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
  if (/^\d+$/.test(bookId)) return "gutenberg";
  if (/^[a-zA-Z0-9_-]{10,}$/.test(bookId)) return "google"; // Google IDs
  return null;
}

const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const source = detectSourceByBookId(q);
    let results = [];

    // 🔹 EXACT BOOK ID → single source only (FAST)
    if (source) {
      if (source === "otthor") {
        results = await searchOtthorById(q);
      } else if (source === "openlibrary") {
        results = await searchOpenLibraryById(q);
      } else if (source === "gutenberg") {
        results = await searchGutenbergById(q);
      } else if (source === "google") {
        results = await searchGoogleById(q);
      }

      return res.json(results);
    }

    // 🔹 TITLE SEARCH (parallel & fast)
    const [otthor, google, openlib, gutenberg] = await Promise.all([
      searchOtthorByTitle(q),
      searchGoogle(q),
      searchOpenLibrary(q),
      searchGutenberg(q)
    ]);

    results = [...otthor, ...google, ...openlib, ...gutenberg];
    res.json(results.slice(0, 20));

  } catch (err) {
    console.error("searchBooks error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};
async function searchOtthorById(bookQid) {
  const [rows] = await db.query(
    `SELECT bookQid, title, author, summary, bookCover
     FROM uploadBook WHERE bookQid = ? LIMIT 1`,
    [bookQid]
  );

  return mapOtthor(rows);
}

async function searchOtthorByTitle(q) {
  const [rows] = await db.query(
    `SELECT bookQid, title, author, summary, bookCover
     FROM uploadBook WHERE title LIKE ? LIMIT 5`,
    [`%${q}%`]
  );

  return mapOtthor(rows);
}

function mapOtthor(rows) {
  return rows.map(b => ({
    bookQid: b.bookQid,
    title: b.title,
    authors: b.author ? b.author.split(",").map(a => a.trim()) : [],
    description: b.summary || null,
    cover: b.bookCover || null,
    source: "otthor"
  }));
}

// async function searchOtthor(q, isBookQid) {
//   const sql = isBookQid
//     ? `SELECT bookQid, title, author, summary, bookCover 
//        FROM uploadBook WHERE bookQid = ?`
//     : `SELECT bookQid, title, author, summary, bookCover 
//        FROM uploadBook WHERE title LIKE ? LIMIT 5`;

//   const [rows] = await db.query(
//     sql,
//     isBookQid ? [q] : [`%${q}%`]
//   );

//   return rows.map(b => ({
//     bookQid: b.bookQid,
//     title: b.title,
//     authors: b.author ? b.author.split(",").map(a => a.trim()) : [],
//     description: b.summary || null,
//     cover: b.bookCover || null,
//     source: "otthor"
//   }));
// }
async function searchGoogleById(id) {
  const data = await fetchJson(
    `https://www.googleapis.com/books/v1/volumes/${id}`
  );

  return [{
    bookQid: data.id,
    title: data.volumeInfo.title,
    authors: data.volumeInfo.authors || [],
    description: data.volumeInfo.description || null,
    cover: data.volumeInfo.imageLinks?.thumbnail || null,
    source: "google"
  }];
}

async function searchOpenLibraryById(id) {
  const data = await fetchJson(
    `https://openlibrary.org/works/${id}.json`
  );

  return [{
    bookQid: id,
    title: data.title,
    authors: [],
    description: data.description || data.description?.value || null,
    cover: data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
      : null,
    source: "openlibrary"
  }];
}

async function searchGutenbergById(id) {
  const data = await fetchJson(`https://gutendex.com/books/${id}`);

  return [{
    bookQid: data.id,
    title: data.title,
    authors: data.authors.map(a => a.name),
    description:  data.summaries?.[0] || null,
    cover: data.formats?.["image/jpeg"] || null,
    source: "gutenberg"
  }];
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
    description: data.description || data.description?.value || null,
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