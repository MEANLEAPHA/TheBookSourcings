// const db = require("../../../../config/db");
// async function searchOtthorByGenre(genreName, limit = 20) {
//   const [rows] = await db.query(
//     `
//     SELECT 
//       bookQid AS bookId,
//       title,
//       bookCover AS cover,
//       author,
//       'otthor' AS source
//     FROM uploadBook
//     WHERE genre = ?
//     LIMIT ?
//     `,
//     [genreId, limit]
//   );

//   return rows;
// }

// async function searchOtthorByAuthor(authorId, limit = 20) {
//   const [rows] = await db.query(
//   `
//   SELECT 
//     bookQid AS bookId,
//     title,
//     bookCover AS cover,
//     author,
//     'otthor' AS source
//   FROM uploadBook
//   WHERE JSON_CONTAINS(authorId, ?)
//   LIMIT ?
//   `,
//   [JSON.stringify(authorId), limit]
// );

// return rows;
// }
// module.exports = {
//   searchOtthorByGenre,
//   searchOtthorByAuthor
// };

const db = require("../../../../config/db");

// Cache
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes (shorter for database queries)
const MAX_CACHE_SIZE = 500;
const cache = new Map();

// Helper functions
function generateCacheKey(endpoint, query, limit = 20) {
  return `otthor:${endpoint}:${query}:${limit}`;
}

async function withCache(cacheKey, fetchFunction) {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && now < cached.expiry) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  
  cache.set(cacheKey, {
    data,
    expiry: now + CACHE_TTL
  });
  
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  return data;
}

async function searchOtthorByGenre(genreName, limit = 20) {
  const cacheKey = generateCacheKey('genre', genreName, limit);
  
  return await withCache(cacheKey, async () => {
    const [rows] = await db.query(
      `
      SELECT 
        bookQid AS bookId,
        title,
        bookCover AS cover,
        author,
        'otthor' AS source
      FROM uploadBook
      WHERE genre = ?
      LIMIT ?
      `,
      [genreName, limit]
    );

    return rows;
  });
}

async function searchOtthorByAuthor(authorId, limit = 20) {
  const cacheKey = generateCacheKey('author', authorId, limit);
  
  return await withCache(cacheKey, async () => {
    const [rows] = await db.query(
      `
      SELECT 
        bookQid AS bookId,
        title,
        bookCover AS cover,
        author,
        'otthor' AS source
      FROM uploadBook
      WHERE JSON_CONTAINS(authorId, ?)
      LIMIT ?
      `,
      [JSON.stringify(authorId), limit]
    );

    return rows;
  });
}

module.exports = {
  searchOtthorByGenre,
  searchOtthorByAuthor
};