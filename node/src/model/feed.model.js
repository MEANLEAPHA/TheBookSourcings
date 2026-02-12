const { getTrendingBooks } = require('./trending.model');
const { getInterestBooks } = require('./interest.model');
const { getRandomBooks } = require('./random.model');

const { rankFeed } = require('../util/rankFeed');

async function buildFeed({ memberQid, limit = 20 }) {
  const result = [];

  const trendingLimit = Math.floor(limit * 0.4);
  const interestLimit = Math.floor(limit * 0.3);
  const randomLimit = limit - (trendingLimit + interestLimit);

  const [
    trendingBooks,
    interestBooks,
    randomBooks
  ] = await Promise.all([
    getTrendingBooks(trendingLimit),
    getInterestBooks(memberQid, interestLimit),
    getRandomBooks(randomLimit)
  ]);

  trendingBooks.forEach(b => b._trending = true);
  interestBooks.forEach(b => b._interest = true);

  result.push(...trendingBooks, ...interestBooks, ...randomBooks);

  const unique = dedupeFeed(result);

  // 🔥 RANK HERE
  const ranked = rankFeed(unique);

  return ranked;
}


function dedupeFeed(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.source}_${item.bookId}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}



module.exports = { buildFeed };

// function softShuffle(arr) {
//   return arr
//     .map(item => ({ item, sort: Math.random() }))
//     .sort((a, b) => a.sort - b.sort)
//     .map(({ item }) => item);
// }

// function generateNextCursor(items) {
//   if (!items.length) return null;
//   return items[items.length - 1].bookId;
// }