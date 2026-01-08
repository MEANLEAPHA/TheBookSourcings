// controllers/feed.controller.js
const { getTrendingBooks } = require('../../../../model/trending.model');
const { getInterestBooks } = require('../../../../model/interest.model');
const { getRandomBooks } = require('../../../../model/random.model');
const { searchOtthorByGenre } = require('../filter/otthorFilter');
const {searchGoogleBookByGenre} = require('../filter/googleFilter');
const {searchGutenbergByGenre} = require('../filter/gutenbergFilter');
const {searchOpenLibraryByGenre} = require('../filter/openlibraryFilter');



async function getFeed(req, res) {
  try {
    const memberQid = req.user?.memberQid || null;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || null;

    const result = [];

    const otthorLimit = Math.floor(limit * 0.4);
    const trendingLimit = Math.floor(limit * 0.3);
    const interestLimit = Math.floor(limit * 0.2);
    const randomLimit = limit - (otthorLimit + trendingLimit + interestLimit);

    const [
      otthorBooks,
      trendingBooks,
      interestBooks,
      randomBooks
    ] = await Promise.all([
      searchOtthorByGenre(null, otthorLimit),
      getTrendingBooks(trendingLimit),
      getInterestBooks(memberQid, interestLimit),
      getRandomBooks(randomLimit)
    ]);

    result.push(
      ...otthorBooks,
      ...trendingBooks,
      ...interestBooks,
      ...randomBooks
    );

    // Deduplicate by bookId + source
    const unique = dedupeFeed(result);

    // Shuffle slightly
    const mixed = softShuffle(unique);

    res.json({
      cursor: generateNextCursor(mixed),
      hasMore: mixed.length >= limit,
      data: mixed
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Feed error' });
  }
}

function dedupeFeed(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.source}_${item.bookId}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function softShuffle(arr) {
  return arr
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function generateNextCursor(items) {
  if (!items.length) return null;
  return items[items.length - 1].bookId;
}
async function getFeedByGenre(req, res) {
  try {
    const { slug } = req.params;
    const cursor = Number(req.query.cursor || 0);
    const limit = 50;

    const feed = await buildGenreFeed(slug);

    const batch = feed.slice(cursor, cursor + limit);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore: cursor + batch.length < feed.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
// async function buildGenreFeed(slug) {
//   const results = await Promise.allSettled([
//     searchGoogleBookByGenre(slug, 40),
//     searchGutenbergByGenre(slug, 40),
//     searchOpenLibraryByGenre(slug, 40),
//     searchOtthorByGenreBySlug(slug, 40) // helper below
//   ]);

//   const books = results
//     .filter(r => r.status === 'fulfilled')
//     .flatMap(r => r.value);

//   // mix + shuffle
//   return books.sort(() => Math.random() - 0.5);
// }
// async function searchOtthorByGenreBySlug(slug, limit = 40) {
//   const [rows] = await db.query(`
//     SELECT genre_id FROM genres WHERE slug = ? LIMIT 1
//   `, [slug]);

//   if (!rows.length) return [];

//   return searchOtthorByGenre(rows[0].genre_id, limit);
// }


module.exports = { getFeed };
