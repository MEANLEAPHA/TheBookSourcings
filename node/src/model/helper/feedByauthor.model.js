const db = require('../../config/db');
const { searchOtthorByAuthor } = require('../../controller/book/trending/filter/otthorFilter');
const {searchGoogleBookByAuthor} = require('../../controller/book/trending/filter/googleFilter');
const {searchGutenbergByAuthor} = require('../../controller/book/trending/filter/gutenbergFilter');
const {searchOpenLibraryByAuthor} = require('../../controller/book/trending/filter/openlibraryFilter');

async function buildAuthorFeed(authorId) {
  let authorName = null;

  // 🔹 OTT author
  if (authorId.startsWith('OTTM')) {
    const [[row]] = await db.query(
      `SELECT username FROM users WHERE authorQid = ? LIMIT 1`,
      [authorId]
    );
    authorName = row?.username;
  } else {
    // 🔹 external author
    const [[row]] = await db.query(
      `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
      [authorId]
    );
    authorName = row?.name;
  }

  if (!authorName) return [];

  const results = await Promise.allSettled([
    searchGoogleBookByAuthor(authorName),
    searchGutenbergByAuthor(authorName),
    searchOpenLibraryByAuthor(authorName),
    searchOtthorByAuthor(authorId)
  ]);

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

module.exports = { buildAuthorFeed };
