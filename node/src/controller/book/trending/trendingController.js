// const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');
const { getMangaDexTrending } = require('./mangaDexController');
const { getInternetArchiveTrending } = require('./internetArchiveController')
 
const { buildFeed } = require('../../../model/feed.model');
const { buildAuthorFeed } = require('../../../model/helper/feedByauthor.model');
const { buildGenreFeed } = require('../../../model/helper/feedBygenre.model');

const { getTrendingBooks } = require('../../../model/trending.model');
const { getInterestBooks } = require('../../../model/interest.model');
const { getRandomBooks } = require('../../../model/random.model');

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
    const [google, gutenberg, openLibrary, otthor, mangaDex, internetArchive] =
      await Promise.all([
        // getGoogleTrending().catch(() => []),
        getGutenbergTrending().catch(() => []),
        getOpenLibraryTrending().catch(() => []),
        getOtthorTrending().catch(() => []),
        getMangaDexTrending().catch(() => []),
        getInternetArchiveTrending().catch(() => [])
      ]);

    const mixed = mixBooksSeeded(
      [...google, ...gutenberg, ...openLibrary, ...otthor, ...mangaDex, ...internetArchive],
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
    const limit = 230;

    const mode = req.query.mode || 'home';
    const genreSlug = req.query.genre || null;
    const authorId = req.query.authorId || null;

    console.log(`🚀 API Called: mode=${mode}, authorId=${authorId}, genre=${genreSlug}, cursor=${cursor}`);

    let feed = [];

    if (mode === 'author' && authorId) {
      feed = await buildAuthorFeed(authorId, limit);
    } else if (mode === 'genre' && genreSlug) {
      feed = await buildGenreFeed(genreSlug, limit);
    } else if (mode === 'home') {
      if (cursor === 0) {
        feed = await buildFeed({
          memberQid: req.user?.memberQid || null,
          limit
        });
      } else {
        feed = await buildExtendedFeed({
          memberQid: req.user?.memberQid || null,
          cursor,
          limit
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode or missing parameters'
      });
    }

    const batch = feed.slice(0, limit);

    console.log(`🎉 Sending response: ${batch.length} items`);

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore: batch.length === limit
    });

  } catch (err) {
    console.error('🔥 getFeed error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
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
module.exports = {
  getAllTrending,
  getFeed
};









// async function getFeed(req, res) {
//   try {
//     const cursor = Number(req.query.cursor || 0);
//     const limit = 100;

//     const mode = req.query.mode || 'home';
//     const genreSlug = req.query.genre || null;
//     const authorId = req.query.authorId || null;

//     let feed = [];

//     // 🔹 HOME
//     if (mode === 'home') {
//       if (cursor === 0) {
//         // ✅ FIRST LOAD
//         feed = await buildFeed({
//           memberQid: req.user?.memberQid || null,
//           limit
//         });
//       } else {
//         // ✅ EXTENSION
//         feed = await buildExtendedFeed({
//           memberQid: req.user?.memberQid || null,
//           cursor,
//           limit
//         });
//       }
//     }

//     // 🔹 GENRE (no extension yet)
//     if (mode === 'genre' && genreSlug) {
//       feed = await buildGenreFeed(genreSlug, limit);
//     }

//     // 🔹 AUTHOR (no extension yet)
//     if (mode === 'author' && authorId) {
//       feed = await buildAuthorFeed(authorId, limit);
//     }

//     const batch = feed.slice(0, limit);

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore: batch.length === limit
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false });
//   }
// }