const { getTrendingBooks } = require('./trending.model');
const { getInterestBooks } = require('./interest.model');
const { getRandomBooks } = require('./random.model');

// function dedupeBooks(books) {
//   const seen = new Set();
//   return books.filter(b => {
//     const key = `${b.source}_${b.bookId}`;
//     if (seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// }

// async function buildFeed({ memberQid }) {
//   const feed = [];

//   // 1️⃣ Trending (global)
//   const trending = await getTrendingBooks(100);
//   feed.push(...trending);

//   // 2️⃣ Interest (personal)
//   if (memberQid) {
//     const interest = await getInterestBooks(memberQid, 30);
//     feed.push(...interest);
//   }

//   // 3️⃣ Random (infinite safety)
//   const random = await getRandomBooks(30);
//   feed.push(...random);

//   return dedupeBooks(feed);
// }

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

  result.push(
    ...trendingBooks,
    ...interestBooks,
    ...randomBooks
  );

  const unique = dedupeFeed(result);
  const mixed = softShuffle(unique);

  return mixed; // ✅ RETURN DATA ONLY
}

// async function buildFeed(req, res) {
//   try {
//     const memberQid = req.user?.memberQid || null;
//     const limit = parseInt(req.query.limit) || 20;
    

//     const result = [];

//     // const otthorLimit = Math.floor(limit * 0.4);
//     const trendingLimit = Math.floor(limit * 0.3);
//     const interestLimit = Math.floor(limit * 0.2);
//     const randomLimit = limit - (otthorLimit + trendingLimit + interestLimit);

//     const [
//       otthorBooks,
//       trendingBooks,
//       interestBooks,
//       randomBooks
//     ] = await Promise.all([
//       // searchOtthorByGenre(null, otthorLimit),
//       getTrendingBooks(trendingLimit),
//       getInterestBooks(memberQid, interestLimit),
//       getRandomBooks(randomLimit)
//     ]);

//     result.push(
//       ...otthorBooks,
//       ...trendingBooks,
//       ...interestBooks,
//       ...randomBooks
//     );

//     // Deduplicate by bookId + source
//     const unique = dedupeFeed(result);

//     // Shuffle slightly
//     const mixed = softShuffle(unique);

//     res.json({
//       cursor: generateNextCursor(mixed),
//       hasMore: mixed.length >= limit,
//       data: mixed
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Feed error' });
//   }
// }

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

module.exports = { buildFeed };
