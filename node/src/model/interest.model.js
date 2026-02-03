const db = require("../config/db");
const { searchOtthorByGenre } = require('../controller/book/trending/filter/otthorFilter');
// const { searchGoogleBookByGenre } = require('../controller/book/trending/filter/googleFilter');
const { searchGutenbergByGenre } = require('../controller/book/trending/filter/gutenbergFilter');
const { searchOpenLibraryByGenre } = require('../controller/book/trending/filter/openlibraryFilter');
const { searchByMangaDexGenre } = require('../controller/book/trending/filter/mangaDexFilter');
const { searchInternetArchiveByGenre } = require('../controller/book/trending/filter/internetArchFilter');


async function getInterestBooks(memberQid, limit = 20) {
  if (!memberQid) return [];

  const [[top]] = await db.query(`
    SELECT genre_id, COUNT(*) AS score
    FROM user_book_activity
    WHERE memberQid = ?
    GROUP BY genre_id
    ORDER BY score DESC
    LIMIT 1
  `, [memberQid]);

  if (!top) return [];

  // 🔑 get genre slug
  const [[genre]] = await db.query(
    `SELECT slug FROM genres WHERE genre_id = ?`,
    [top.genre_id]
  );

  if (!genre) return [];

  const results = await Promise.allSettled([
    // searchGoogleBookByGenre(genre.slug, limit),
    searchGutenbergByGenre(genre.slug, limit),
    searchByMangaDexGenre(genre.slug, limit),
    searchInternetArchiveByGenre(genre.slug, limit),
    searchOpenLibraryByGenre(genre.slug, limit),
    searchOtthorByGenre(top.genre_id, limit)
  ]);

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort(() => Math.random() - 0.5);
}

module.exports = { getInterestBooks };


// async function getInterestBooks(memberQid, limit = 20) {
//   if (!memberQid) return [];

//   const [rows] = await db.query(
//     `
//     SELECT genre_id, COUNT(*) AS score
//     FROM user_book_activity
//     WHERE memberQid = ?
//     GROUP BY genre_id
//     ORDER BY score DESC
//     LIMIT 1
//     `,
//     [memberQid]
//   );

//   if (!rows.length) return [];

//   const topGenreId = rows[0].genre_id;

//   return searchOtthorByGenre(topGenreId, limit);
// }
