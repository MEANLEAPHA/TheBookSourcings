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
    [genreId, limit]
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
  WHERE JSON_CONTAINS(authorId, ?)
  LIMIT ?
  `,
  [JSON.stringify(authorId), limit]
);

return rows;
}
module.exports = {
  searchOtthorByGenre,
  searchOtthorByAuthor
};
