const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');

const { buildFeed } = require('../../../model/feed.model');
const { buildAuthorFeed } = require('../../../model/helper/feedByauthor.model');
const { buildGenreFeed } = require('../../../model/helper/feedBygenre.model');

const { getTrendingBooks } = require('../../../model/trending.model');
const { getInterestBooks } = require('../../../model/interest.model');
const { getRandomBooks } = require('../../../model/random.model');
// const { dedupeFeed } = require('../../../util/feedUtils');
const { rankFeed } = require('../../../util/rankFeed');

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


async function getFeed(req, res) {
  try {
    const cursor = Number(req.query.cursor || 0);
    const limit = 100;

    const mode = req.query.mode || 'home';
    const genreSlug = req.query.genre || null;
    const authorId = req.query.authorId || null;

    let feed = [];

    // 🔹 HOME
    if (mode === 'home') {
      if (cursor === 0) {
        // ✅ FIRST LOAD
        feed = await buildFeed({
          memberQid: req.user?.memberQid || null,
          limit
        });
      } else {
        // ✅ EXTENSION
        feed = await buildExtendedFeed({
          memberQid: req.user?.memberQid || null,
          cursor,
          limit
        });
      }
    }

    // 🔹 GENRE (no extension yet)
    if (mode === 'genre' && genreSlug) {
      feed = await buildGenreFeed(genreSlug, limit);
    }

    // 🔹 AUTHOR (no extension yet)
    if (mode === 'author' && authorId) {
      feed = await buildAuthorFeed(authorId, limit);
    }

    const batch = feed.slice(0, limit);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore: batch.length === limit
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}


async function buildExtendedFeed({ memberQid, cursor, limit }) {
  let items = [];

  // 🔹 Phase derived from cursor depth
  let phase = 0;

  if (cursor > 200) phase = 4;
  else if (cursor > 150) phase = 3;
  else if (cursor > 100) phase = 2;
  else if (cursor > 50) phase = 1;

  switch (phase) {
    case 0:
      items = await getTrendingBooks(limit);
      break;

    case 1:
      items = await getInterestBooks(memberQid, limit);
      break;

    case 2:
      items = await buildAuthorFeed(memberQid, limit);
      break;

    case 3:
      items = await buildGenreFeed(null, limit);
      break;

    default:
      items = await getRandomBooks(limit);
  }

  return rankFeed(dedupeFeed(items));
}



function dedupeFeed(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.source}_${item.bookId}`;
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}
async function getUserInterestProfile(memberQid) {
  const [rows] = await db.query(`
    SELECT 
      genre_id,
      author_id,
      COUNT(*) as score
    FROM user_book_activity
    WHERE memberQid = ?
      AND activity_type = 'view'
    GROUP BY genre_id, author_id
    ORDER BY score DESC
    LIMIT 10
  `, [memberQid]);

  return rows;
}

async function resolveInterestEntities(interests) {
  const genreIds = interests.map(i => i.genre_id).filter(Boolean);
  const authorIds = interests.map(i => i.author_id).filter(Boolean);

  const [genres] = genreIds.length
    ? await db.query(
        `SELECT genre_id, slug FROM genres WHERE genre_id IN (?)`,
        [genreIds]
      )
    : [[]];

  const [authors] = authorIds.length
    ? await db.query(
        `SELECT author_id, name, slug FROM authors WHERE author_id IN (?)`,
        [authorIds]
      )
    : [[]];

  return { genres, authors };
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

// async function getFeed(req, res) {
//   try {
//     const seed = Number(req.query.seed || 0);
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 50;

//     // STEP 1: feed = trending seed ONLY (for now)
//     const seedFeed = await buildSeededFeed(seed);

//     const batch = seedFeed.slice(cursor, cursor + limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       source: 'seed'
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }


// async function getFeed(req, res) {
//   try {
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 50;
//     const memberQid = req.user?.memberQid || null;

//     const feed = await buildFeed({ memberQid });

//     const batch = feed.slice(cursor, cursor + limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore: cursor + batch.length < feed.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }

// async function getFeed(req, res) {
//   try {
//     const seed = Number(req.query.seed || 0);
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 50;

//     const memberQid = req.user?.memberQid || null;

//     // 1️⃣ Seed feed (trending)
//     const seedFeed = await buildSeededFeed(seed);

//     // 2️⃣ Extension feed (smart continuation)
//     const extensionFeed = memberQid
//       ? await buildExtensionFeed(memberQid, seed)
//       : [];

//     // 3️⃣ Combine
//     const fullFeed = [...seedFeed, ...extensionFeed];

//     const batch = fullFeed.slice(cursor, cursor + limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore: cursor + batch.length < fullFeed.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }

// async function getFeed(req, res) {
//   try {
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 50;

//     const mode = req.query.mode || 'home';
//     const genreSlug = req.query.genre || null;
//     const authorId = req.query.authorId || null;

//     let feed = [];

//     if (mode === 'home') {
//       feed = await buildFeed({
//         memberQid: req.user?.memberQid || null,
//         limit
//       });
//     }

//     if (mode === 'genre' && genreSlug) {
//       feed = await buildGenreFeed(genreSlug, limit);
//     }

//     if (mode === 'author' && authorId) {
//       feed = await buildAuthorFeed(authorId, limit);
//     }

//     const batch = feed.slice(cursor, cursor + limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore: cursor + batch.length < feed.length
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }