const db = require("../../../../config/db");
async function searchOtthorByGenre(genreName, limit = 20) {
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
}

async function searchOtthorByAuthor(authorId, limit = 20) {
  const [rows] = await db.query(
    `
    SELECT 
      bookQid AS bookId,
      title,
      bookCover AS cover,
      author,
      'otthor' AS source
    FROM uploadBook
    WHERE JSON_CONTAINS(authorId, JSON_QUOTE(?))
    LIMIT ?
    `,
    [authorId, limit]
  );

  return rows;
}
module.exports = {
  searchOtthorByGenre,
  searchOtthorByAuthor
};
