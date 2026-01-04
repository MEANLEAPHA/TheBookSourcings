const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');

const feedCache = new Map(); 
async function getAllTrending(req, res) {
  try {
    const seed = Number(req.query.seed || 0);
    const cursor = Number(req.query.cursor || 0);
    const limit = 50;

    const data = await buildSeededFeed(seed);
    const batch = data.slice(cursor, cursor + limit);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore: cursor + batch.length < data.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}

async function getFeed(req, res) {
  try {
    const seed = Number(req.query.seed || 0);
    const cursor = Number(req.query.cursor || 0);
    const limit = 50;

    // STEP 1: feed = trending seed ONLY (for now)
    const seedFeed = await buildSeededFeed(seed);

    const batch = seedFeed.slice(cursor, cursor + limit);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      source: 'seed'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}


async function buildSeededFeed(seed) {
  // const limit = 50;
  let cached = feedCache.get(seed);

  if (!cached || Date.now() > cached.expiry) {
    const [google, gutenberg, openLibrary, otthor] =
      await Promise.all([
        getGoogleTrending().catch(() => []),
        getGutenbergTrending().catch(() => []),
        getOpenLibraryTrending().catch(() => []),
        getOtthorTrending().catch(() => [])
      ]);

    const mixed = mixBooksSeeded(
      [...google, ...gutenberg, ...openLibrary, ...otthor],
      seed
    );

    cached = {
      data: mixed,
      expiry: Date.now() + 1000 * 60 * 5
    };

    feedCache.set(seed, cached);
  }

  return cached.data;
}


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

module.exports = {
  getAllTrending,
  getFeed
};


// async function getAllTrending(req, res) {
//   try {
//     const seed = Number(req.query.seed || 0);
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 50;

//     let cached = feedCache.get(seed);

//     // ✅ BUILD FEED ONLY ONCE PER SEED
//     if (!cached || Date.now() > cached.expiry) {
//       const [google, gutenberg, openLibrary, otthor] =
//         await Promise.all([
//           getGoogleTrending().catch(() => []),
//           getGutenbergTrending().catch(() => []),
//           getOpenLibraryTrending().catch(() => []),
//           getOtthorTrending().catch(() => [])
//         ]);

//       const mixed = mixBooksSeeded(
//         [...google, ...gutenberg, ...openLibrary, ...otthor],
//         seed
//       );

//       cached = {
//         data: mixed,
//         expiry: Date.now() + 1000 * 60 * 5
//       };

//       feedCache.set(seed, cached);
//     }

//     // ✅ PAGINATION (cursor-based)
//     const batch = cached.data.slice(cursor, cursor + limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }