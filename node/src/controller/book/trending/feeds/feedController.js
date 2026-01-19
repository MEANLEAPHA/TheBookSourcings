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
    const limit = parseInt(req.query.limit) || 50;
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

module.exports = { getFeed };
