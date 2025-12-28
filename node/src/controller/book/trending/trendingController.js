// Import dependencies
const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');

let trendingCache = {
  data: null,
  expiry: 0
};

function isCacheValid() {
  return trendingCache.data && Date.now() < trendingCache.expiry;
}
async function getAllTrending(req, res) {
  try {
    const seed = Number(req.query.seed || 0);
    const cursor = Number(req.query.cursor || 0);
    const limit = 20;

    if (isCacheValid() && cursor === 0) {
      return res.json({
        success: true,
        data: trendingCache.data.slice(0, limit),
        nextCursor: limit
      });
    }

    const [
      google,
      gutenberg,
      openLibrary,
      otthor
    ] = await Promise.all([
      getGoogleTrending().catch(() => []),
      getGutenbergTrending().catch(() => []),
      getOpenLibraryTrending().catch(() => []),
      getOtthorTrending().catch(() => [])
    ]);

    const allBooks = [
      ...google,
      ...gutenberg,
      ...openLibrary,
      ...otthor
    ];

    const mixed = mixBooksSeeded(allBooks, seed);

    trendingCache = {
      data: mixed,
      expiry: Date.now() + 1000 * 60 * 5
    };

    const batch = mixed.slice(cursor, cursor + limit);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}



// async function getAllTrending(req, res) {
//   try {
//     // ✅ 1. RETURN CACHE IF VALID
//     if (isCacheValid()) {
//       return res.json({
//         success: true,
//         data: trendingCache.data
//       });
//     }

//     // ✅ 2. FETCH ALL SOURCES IN PARALLEL
//     const [
//       google,
//       gutenberg,
//       openLibrary,
//       otthor
//     ] = await Promise.all([
//       getGoogleTrending().catch(() => []),
//       getGutenbergTrending().catch(() => []),
//       getOpenLibraryTrending().catch(() => []),
//       getOtthorTrending().catch(() => [])
//     ]);

//     // ✅ 3. MIX & LIMIT
//     const mixedBooks = mixBooks([
//       ...otthor,
//       ...google,
//       ...gutenberg,
//       ...openLibrary
//     ]);

//     // ✅ 4. SAVE TO CACHE
//     trendingCache = {
//       data: mixedBooks,
//       expiry: Date.now() + 1000 * 60 * 5 // 5 minutes
//     };

//     // ✅ 5. SEND RESPONSE
//     res.json({
//       success: true,
//       data: mixedBooks
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }
function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mixBooksSeeded(books, seed) {
  const clean = books.filter(b => b && b.title);
  const rand = mulberry32(seed);

  for (let i = clean.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [clean[i], clean[j]] = [clean[j], clean[i]];
  }

  return clean;
}


// Export the function
module.exports = {
  getAllTrending
};
