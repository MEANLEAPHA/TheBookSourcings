const db = require('../../config/db');

const { searchOtthorByGenre } = require('../../controller/book/trending/filter/otthorFilter');
const {searchGoogleBookByGenre} = require('../../controller/book/trending/filter/googleFilter');
const {searchGutenbergByGenre} = require('../../controller/book/trending/filter/gutenbergFilter');
const {searchOpenLibraryByGenre} = require('../../controller/book/trending/filter/openlibraryFilter');

async function buildGenreFeed(genreSlug) {
  // 1️⃣ resolve genre_id + name
  const [[genre]] = await db.query(
    `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
    [genreSlug]
  );

  if (!genre) return [];

  const genreName = genre.name;

  // 2️⃣ fetch all sources
  const results = await Promise.allSettled([
    searchGoogleBookByGenre(genreName),
    searchGutenbergByGenre(genreName),
    searchOpenLibraryByGenre(genreSlug),
    searchOtthorByGenre(genre.genre_id)
  ]);

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

module.exports = { buildGenreFeed };
