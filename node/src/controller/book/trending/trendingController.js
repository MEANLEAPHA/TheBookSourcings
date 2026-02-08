
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');
const { getMangaDexTrending } = require('./mangaDexController');
const { getInternetArchiveTrending } = require('./internetArchiveController');

const { buildFeed } = require('../../../model/feed.model');
const { buildAuthorFeed } = require('../../../model/helper/feedByauthor.model');
const { buildGenreFeed } = require('../../../model/helper/feedBygenre.model');

const { getTrendingBooks } = require('../../../model/trending.model');
const { getInterestBooks } = require('../../../model/interest.model');
const { getRandomBooks } = require('../../../model/random.model');

const { rankFeed } = require('../../../util/rankFeed');
const { getTopGenresForUser, getTopAuthorsForUser } = require('../../../model/nav.model');

// Improved cache system
const feedCache = new Map();
const FEED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for mixed feed
const GENRE_FEED_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const AUTHOR_FEED_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Clean old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of feedCache.entries()) {
    if (now > value.expiry) {
      feedCache.delete(key);
    }
  }
}, 60 * 1000);

// --- TRENDING FEED ---
async function getAllTrending(req, res) {
  try {
    const seed = validateSeed(req.query.seed || 0);
    const memberQid = req.user?.memberQid || null; // Use optional chaining
    const cursor = Math.max(0, Number(req.query.cursor || 0));
    const limit = Math.min(50, Number(req.query.limit || 50));

    const data = await buildSeededFeed(seed, memberQid);
    const batch = data.slice(cursor, cursor + limit);
    const hasMore = cursor + batch.length < data.length;

    res.json({
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore
    });

  } catch (err) {
    console.error('Trending feed error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trending feed'
    });
  }
}

async function buildSeededFeed(seed, memberQid) {
 
  const cacheKey = `trending:${seed}`;
  let cached = feedCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    console.log(`📦 Serving trending feed from cache (seed: ${seed})`);
    return cached.data;
  }

  console.log(`🌐 Building trending feed (seed: ${seed})`);

  let genreBooks = [];
    let authorBooks = [];
  if(memberQid){
    const topGenres = await getTopGenresForUser(memberQid, 15);
    if (topGenres.length > 0) {
      const genrePromises = topGenres.map(genre => 
        buildGenreFeed(genre.slug, 10)
      );
      const genreResults = await Promise.allSettled(genrePromises);
      genreResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          genreBooks = [...genreBooks, ...result.value];
        }
      });
    };

    const topAuthors = await getTopAuthorsForUser(memberQid, 10);
    if (topAuthors.length > 0) {
      const authorPromises = topAuthors.map(author => 
        buildAuthorFeed(author.id, 10)
      );
      const authorResults = await Promise.allSettled(authorPromises);
      authorResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          authorBooks = [...authorBooks, ...result.value];
        }
      });
    };
  }
  // Fetch all trending sources in parallel (they're already individually cached)
  const [gutenberg, openLibrary, otthor, mangaDex, internetArchive] =
    await Promise.all([
      getGutenbergTrending(),
      getOpenLibraryTrending(),
      getOtthorTrending(),
      getMangaDexTrending(),
      getInternetArchiveTrending()
    ]);

  // Combine and shuffle
  const allBooks = [
    ...(gutenberg || []),
    ...(openLibrary || []),
    ...(otthor || []),
    ...(mangaDex || []),
    ...(internetArchive || []),
    ...genreBooks || [],
    ...authorBooks || []
  ].filter(b => b && b.title && b.bookId); 

  const mixed = shuffleBooks(allBooks, seed);

  // Cache the result
  feedCache.set(cacheKey, {
    data: mixed,
    expiry: Date.now() + FEED_CACHE_DURATION
  });

  // Limit cache size
  if (feedCache.size > 100) {
    const firstKey = feedCache.keys().next().value;
    feedCache.delete(firstKey);
  }

  console.log(`✅ Trending feed built and cached (${mixed.length} books)`);
  return mixed;
}

// --- MAIN FEED WITH PAGINATION ---
async function getFeed(req, res) {
  try {
    const cursor = Math.max(0, Number(req.query.cursor || 0));
    const limit = Math.min(100, Number(req.query.limit || 100)); // Reduced from 230
    
    const mode = req.query.mode || 'home';
    const genreSlug = req.query.genre || null;
    const authorId = req.query.authorId || null;

    console.log(`🚀 Feed request: mode=${mode}, cursor=${cursor}, limit=${limit}`);

    let feed = [];
    let cacheKey = null;

    // Build cache key
    if (mode === 'author' && authorId) {
      cacheKey = `author:${authorId}:${cursor}`;
    } else if (mode === 'genre' && genreSlug) {
      cacheKey = `genre:${genreSlug}:${cursor}`;
    } else if (mode === 'home') {
      cacheKey = `home:${req.user?.memberQid || 'anon'}:${cursor}`;
    }

    // Check cache
    if (cacheKey && feedCache.has(cacheKey)) {
      const cached = feedCache.get(cacheKey);
      if (Date.now() < cached.expiry) {
        console.log(`📦 Serving ${mode} feed from cache`);
        return res.json(cached.data);
      }
    }

    // Fetch fresh data
    if (mode === 'author' && authorId) {
      feed = await buildAuthorFeed(authorId, limit + 20); // Fetch extra for deduplication
    } else if (mode === 'genre' && genreSlug) {
      feed = await buildGenreFeed(genreSlug, limit + 20);
    } else if (mode === 'home') {
      if (cursor === 0) {
        feed = await buildFeed({
          memberQid: req.user?.memberQid || null,
          limit: limit + 20
        });
      } else {
        feed = await buildExtendedFeed({
          memberQid: req.user?.memberQid || null,
          cursor,
          limit: limit + 20
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode or missing parameters'
      });
    }

    // Deduplicate and rank
    const deduped = dedupeFeed(feed);
    const ranked = rankFeed(deduped);
    const batch = ranked.slice(0, limit);
    const hasMore = deduped.length > limit;

    const response = {
      success: true,
      data: batch,
      nextCursor: cursor + batch.length,
      hasMore
    };

    // Cache the response
    if (cacheKey) {
      const cacheDuration = mode === 'author' ? AUTHOR_FEED_CACHE_DURATION :
                          mode === 'genre' ? GENRE_FEED_CACHE_DURATION :
                          FEED_CACHE_DURATION;
      
      feedCache.set(cacheKey, {
        data: response,
        expiry: Date.now() + cacheDuration
      });
    }

    console.log(`✅ ${mode} feed built: ${batch.length} items, hasMore: ${hasMore}`);
    res.json(response);

  } catch (err) {
    console.error('Feed error:', err);
    
    // Try to serve stale cache
    if (cacheKey && feedCache.has(cacheKey)) {
      console.log(`🔄 Serving stale ${mode} feed due to error`);
      const cached = feedCache.get(cacheKey);
      cached.data._stale = true;
      return res.json(cached.data);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch feed'
    });
  }
}

// Improved extended feed with smart pagination
async function buildExtendedFeed({ memberQid, cursor, limit }) {
  // Dynamic phases based on available content
  const phases = [
    { type: 'trending', threshold: 50 },
    { type: 'interest', threshold: 100 },
    { type: 'author', threshold: 150 },
    { type: 'genre', threshold: 200 },
    { type: 'random', threshold: Infinity }
  ];

  // Determine current phase
  let currentPhase = phases[0];
  for (const phase of phases) {
    if (cursor < phase.threshold) {
      currentPhase = phase;
      break;
    }
  }

  console.log(`🔄 Extended feed: cursor=${cursor}, phase=${currentPhase.type}`);

  let items = [];
  switch (currentPhase.type) {
    case 'trending':
      items = await getTrendingBooks(limit);
      break;
    case 'interest':
      items = await getInterestBooks(memberQid, limit);
      break;
    case 'author':
      items = await buildAuthorFeed(memberQid, limit);
      break;
    case 'genre':
      items = await buildGenreFeed(null, limit);
      break;
    default:
      items = await getRandomBooks(limit);
  }

  return items || [];
}

// Improved deduplication
function dedupeFeed(items) {
  const seen = new Set();
  const unique = [];
  
  for (const item of items) {
    if (!item || !item.bookId) continue;
    
    const key = `${item.source || 'unknown'}_${item.bookId}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  
  return unique;
}

// Improved shuffle algorithm
function shuffleBooks(books, seed) {
  if (!books || books.length === 0) return [];
  
  const shuffled = [...books];
  const random = mulberry32(seed);
  
  // Fisher-Yates shuffle with seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Validate and normalize seed
function validateSeed(seed) {
  const num = Math.abs(Number(seed));
  return isNaN(num) ? Date.now() % 1000000 : num % 1000000;
}

// Keep your existing mulberry32 function
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

module.exports = {
  getAllTrending,
  getFeed
};


// const { getGutenbergTrending } = require('./gutenbergController');
// const { getOpenLibraryTrending } = require('./openLibraryController');
// const { getOtthorTrending } = require('./otthorController');
// const { getMangaDexTrending } = require('./mangaDexController');
// const { getInternetArchiveTrending } = require('./internetArchiveController');
// const { buildFeed } = require('../../../model/feed.model');
// const { buildAuthorFeed } = require('../../../model/helper/feedByauthor.model');
// const { buildGenreFeed } = require('../../../model/helper/feedBygenre.model');
// const { getTrendingBooks } = require('../../../model/trending.model');
// const { getInterestBooks } = require('../../../model/interest.model');
// const { getRandomBooks } = require('../../../model/random.model');
// const { rankFeed } = require('../../../util/rankFeed');
// const { getTopGenresForUser, getTopAuthorsForUser } = require('../../../model/nav.model');

// // Improved cache system
// const feedCache = new Map();
// const FEED_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for mixed feed
// const GENRE_FEED_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
// const AUTHOR_FEED_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes


// async function getPersonalizedGenres(memberQid, limit = 15) {
//   if (!memberQid) {
//     // For guests, return popular genres
//     return [
//       { slug: 'fiction', name: 'Fiction' },
//       { slug: 'science', name: 'Science' },
//       { slug: 'fantasy', name: 'Fantasy' },
//       { slug: 'romance', name: 'Romance' },
//       { slug: 'biography', name: 'Biography' }
//     ];
//   }
  
//   try {
//     return await getTopGenresForUser(memberQid, limit);
//   } catch (err) {
//     console.error('Error getting personalized genres:', err);
//     return [];
//   }
// }

// async function getPersonalizedAuthors(memberQid, limit = 10) {
//   if (!memberQid) {
//     return [];
//   }
  
//   try {
//     return await getTopAuthorsForUser(memberQid, limit);
//   } catch (err) {
//     console.error('Error getting personalized authors:', err);
//     return [];
//   }
// }

// // Clean old cache entries periodically
// setInterval(() => {
//   const now = Date.now();
//   for (const [key, value] of feedCache.entries()) {
//     if (now > value.expiry) {
//       feedCache.delete(key);
//     }
//   }
// }, 60 * 1000);

// // --- HELPER FUNCTIONS ---

// function dedupeFeed(items) {
//   const seen = new Set();
//   const unique = [];
  
//   for (const item of items) {
//     if (!item || !item.bookId) continue;
    
//     const key = `${item.source || 'unknown'}_${item.bookId}`;
//     if (!seen.has(key)) {
//       seen.add(key);
//       unique.push(item);
//     }
//   }
  
//   return unique;
// }

// function shuffleBooks(books, seed) {
//   if (!books || books.length === 0) return [];
  
//   const shuffled = [...books];
//   const random = mulberry32(seed);
  
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
  
//   return shuffled;
// }

// function validateSeed(seed) {
//   const num = Math.abs(Number(seed));
//   return isNaN(num) ? Date.now() % 1000000 : num % 1000000;
// }

// function mulberry32(seed) {
//   return function() {
//     let t = seed += 0x6D2B79F5;
//     t = Math.imul(t ^ t >>> 15, t | 1);
//     t ^= t + Math.imul(t ^ t >>> 7, t | 61);
//     return ((t ^ t >>> 14) >>> 0) / 4294967296;
//   };
// }

// // --- TRENDING FEED ---

// async function getAllTrending(req, res) {
//   try {
//     const seed = validateSeed(req.query.seed || 0);
//     const cursor = Math.max(0, Number(req.query.cursor || 0));
//     const limit = Math.min(50, Number(req.query.limit || 50));
//     const memberQid = req.user?.memberQid || null;

//     // For logged-in users, mix trending with their interests
//     const data = memberQid 
//       ? await buildPersonalizedTrendingFeed(seed, memberQid)
//       : await buildSeededFeed(seed);
    
//     const batch = data.slice(cursor, cursor + limit);
//     const hasMore = cursor + batch.length < data.length;

//     res.json({
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore
//     });

//   } catch (err) {
//     console.error('Trending feed error:', err);
//     res.status(500).json({ 
//       success: false,
//       error: 'Failed to fetch trending feed'
//     });
//   }
// }

// async function buildSeededFeed(seed) {
//   const cacheKey = `trending:${seed}`;
//   let cached = feedCache.get(cacheKey);

//   if (cached && Date.now() < cached.expiry) {
//     console.log(`📦 Serving trending feed from cache (seed: ${seed})`);
//     return cached.data;
//   }

//   console.log(`🌐 Building trending feed (seed: ${seed})`);
  
//   const [gutenberg, openLibrary, otthor, mangaDex, internetArchive] =
//     await Promise.all([
//       getGutenbergTrending(),
//       getOpenLibraryTrending(),
//       getOtthorTrending(),
//       getMangaDexTrending(),
//       getInternetArchiveTrending()
//     ]);

//   const allBooks = [
//     ...(gutenberg || []),
//     ...(openLibrary || []),
//     ...(otthor || []),
//     ...(mangaDex || []),
//     ...(internetArchive || [])
//   ].filter(b => b && b.title && b.bookId);

//   const mixed = shuffleBooks(allBooks, seed);

//   feedCache.set(cacheKey, {
//     data: mixed,
//     expiry: Date.now() + FEED_CACHE_DURATION
//   });

//   if (feedCache.size > 50) {
//     const firstKey = feedCache.keys().next().value;
//     feedCache.delete(firstKey);
//   }

//   console.log(`✅ Trending feed built and cached (${mixed.length} books)`);
//   return mixed;
// }

// async function buildPersonalizedTrendingFeed(seed, memberQid) {
//   try {
//     // Get user's top genres
    
    
//     // Get trending from all sources
//     const [gutenberg, openLibrary, otthor, mangaDex, internetArchive] =
//       await Promise.all([
//         getGutenbergTrending(),
//         getOpenLibraryTrending(),
//         getOtthorTrending(),
//         getMangaDexTrending(),
//         getInternetArchiveTrending()
//       ]);


//     // Get genre-based books for user's interests
//     const topGenres = await getTopGenresForUser(memberQid, 15);
//     let genreBooks = [];
//     if (topGenres.length > 0) {
//       const genrePromises = topGenres.map(genre => 
//         buildGenreFeed(genre.slug, 10)
//       );
//       const genreResults = await Promise.allSettled(genrePromises);
//       genreResults.forEach(result => {
//         if (result.status === 'fulfilled' && result.value) {
//           genreBooks = [...genreBooks, ...result.value];
//         }
//       });
//     }

//     // Combine all books
//     const allBooks = [
//       ...(gutenberg || []),
//       ...(openLibrary || []),
//       ...(otthor || []),
//       ...(mangaDex || []),
//       ...(internetArchive || []),
//       ...genreBooks
//     ].filter(b => b && b.title && b.bookId);

//     // Shuffle with seed
//     const mixed = shuffleBooks(allBooks, seed);

//     // Boost user's genre books in the feed
//     if (genreBooks.length > 0) {
//       const boosted = [...genreBooks.slice(0, 5), ...mixed];
//       return dedupeFeed(boosted);
//     }

//     return mixed;

//   } catch (err) {
//     console.error('Personalized trending error:', err);
//     return await buildSeededFeed(seed);
//   }
// }

// // --- PERSONALIZED DATA HELPERS ---

// async function getPersonalizedGenres(memberQid, limit = 3) {
//   if (!memberQid) {
//     // For guests, return popular genres
//     return [
//       { slug: 'fiction', name: 'Fiction' },
//       { slug: 'science', name: 'Science' },
//       { slug: 'fantasy', name: 'Fantasy' },
//       { slug: 'romance', name: 'Romance' },
//       { slug: 'biography', name: 'Biography' }
//     ];
//   }
  
//   try {
//     return await getTopGenresForUser(memberQid, limit);
//   } catch (err) {
//     console.error('Error getting personalized genres:', err);
//     return [];
//   }
// }

// async function getPersonalizedAuthors(memberQid, limit = 10) {
//   if (!memberQid) {
//     return [];
//   }
  
//   try {
//     return await getTopAuthorsForUser(memberQid, limit);
//   } catch (err) {
//     console.error('Error getting personalized authors:', err);
//     return [];
//   }
// }

// // --- EXTENDED FEED LOGIC ---

// async function getMixedRecommendations(memberQid, topGenres, topAuthors, limit) {
//   const promises = [];
  
//   // Add interest-based books
//   if (memberQid) {
//     promises.push(getInterestBooks(memberQid, Math.floor(limit / 2)));
//   }
  
//   // Add genre-based books
//   if (topGenres.length > 0) {
//     const randomGenre = topGenres[Math.floor(Math.random() * topGenres.length)];
//     promises.push(buildGenreFeed(randomGenre.slug, Math.floor(limit / 3)));
//   }
  
//   // Add author-based books
//   if (topAuthors.length > 0) {
//     const randomAuthor = topAuthors[Math.floor(Math.random() * topAuthors.length)];
//     promises.push(buildAuthorFeed(randomAuthor.author_id, Math.floor(limit / 3)));
//   }
  
//   // Execute all promises
//   const results = await Promise.allSettled(promises);
  
//   // Combine successful results
//   let allItems = [];
//   results.forEach(result => {
//     if (result.status === 'fulfilled' && result.value) {
//       allItems = [...allItems, ...result.value];
//     }
//   });
  
//   // If no successful results, return random books
//   if (allItems.length === 0) {
//     return await getRandomBooks(limit);
//   }
  
//   return dedupeFeed(allItems).slice(0, limit);
// }

// async function buildExtendedFeed({ memberQid, cursor, limit }) {
//   console.log(`🔄 Extended feed for ${memberQid || 'guest'}: cursor=${cursor}, limit=${limit}`);
  
//   // Get user's top genres and authors
//   const [topGenres, topAuthors] = await Promise.all([
//     getPersonalizedGenres(memberQid, 10),
//     getPersonalizedAuthors(memberQid, 10)
//   ]);
  
//   // Determine which phase we're in based on cursor
//   const phaseSize = 30;
//   const phase = Math.floor(cursor / phaseSize) % 4;
  
//   let items = [];
  
//   try {
//     switch (phase) {
//       case 0: // Phase 1: Trending books
//         items = await getTrendingBooks(limit);
//         break;
        
//       case 1: // Phase 2: Genre-based
//         if (topGenres.length > 0) {
//           const randomGenre = topGenres[Math.floor(Math.random() * topGenres.length)];
//           items = await buildGenreFeed(randomGenre.slug, limit);
//         } else {
//           const fallbackGenres = ['fiction', 'science', 'fantasy'];
//           const randomGenre = fallbackGenres[Math.floor(Math.random() * fallbackGenres.length)];
//           items = await buildGenreFeed(randomGenre, limit);
//         }
//         break;
        
//       case 2: // Phase 3: Author-based
//         if (topAuthors.length > 0) {
//           const randomAuthor = topAuthors[Math.floor(Math.random() * topAuthors.length)];
//           items = await buildAuthorFeed(randomAuthor.author_id, limit);
//         } else {
//           items = await getRandomBooks(limit);
//         }
//         break;
        
//       case 3: // Phase 4: Mixed recommendations
//         items = await getMixedRecommendations(memberQid, topGenres, topAuthors, limit);
//         break;
        
//       default:
//         items = await getRandomBooks(limit);
//     }
//   } catch (err) {
//     console.error(`Error in extended feed phase ${phase}:`, err);
//     items = await getRandomBooks(limit);
//   }
  
//   // Fill with random books if needed
//   if (items.length < limit) {
//     const additionalItems = await getRandomBooks(limit - items.length);
//     items = [...items, ...additionalItems];
//   }
  
//   const deduped = dedupeFeed(items);
//   return deduped.slice(0, limit) || [];
// }

// // --- MAIN FEED ENDPOINT ---

// async function getFeed(req, res) {
//   let cacheKey = null;
  
//   try {
//     const cursor = Math.max(0, Number(req.query.cursor || 0));
//     const limit = Math.min(100, Number(req.query.limit || 100));
    
//     const mode = req.query.mode || 'home';
//     const genreSlug = req.query.genre || null;
//     const authorId = req.query.authorId || null;
//     const seed = req.query.seed ? Number(req.query.seed) : Date.now(); // ADD THIS LINE
//     const memberQid = req.user?.memberQid || null;

//     console.log(`🚀 Feed request: mode=${mode}, cursor=${cursor}, member=${memberQid || 'guest'}, seed=${seed}`);

//     // Build cache key (include seed for home mode)
//     if (mode === 'author' && authorId) {
//       cacheKey = `author:${authorId}:${cursor}`;
//     } else if (mode === 'genre' && genreSlug) {
//       cacheKey = `genre:${genreSlug}:${cursor}`;
//     } else if (mode === 'home') {
//       cacheKey = `home:${memberQid || 'guest'}:${seed}:${cursor}`; // Include seed in cache key
//     }

//     // Check cache (skip for guest home feed to keep it fresh)
//     if (cacheKey && feedCache.has(cacheKey) && (mode !== 'home' || memberQid)) {
//       const cached = feedCache.get(cacheKey);
//       if (Date.now() < cached.expiry) {
//         console.log(`📦 Serving ${mode} feed from cache`);
//         return res.json(cached.data);
//       }
//     }

//     let feed = [];

//     // Fetch fresh data based on mode
//     if (mode === 'author' && authorId) {
//       feed = await buildAuthorFeed(authorId, limit + 20);
//     } else if (mode === 'genre' && genreSlug) {
//       feed = await buildGenreFeed(genreSlug, limit + 20);
//     } else if (mode === 'home') {
//       if (cursor === 0) {
//         // First page: use buildFeed with seed
//         feed = await buildHomeFeedWithSeed(memberQid, seed, limit + 20); // NEW FUNCTION
//       } else {
//         // Subsequent pages: use extended feed logic
//         feed = await buildExtendedFeed({
//           memberQid: memberQid,
//           cursor: cursor,
//           limit: limit + 20,
//           seed: seed // Pass seed to extended feed
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid mode or missing parameters'
//       });
//     }

//     // Process the feed
//     const deduped = dedupeFeed(feed);
//     const ranked = rankFeed(deduped);
//     const batch = ranked.slice(0, limit);
//     const hasMore = deduped.length > limit;

//     const response = {
//       success: true,
//       data: batch,
//       nextCursor: cursor + batch.length,
//       hasMore
//     };

//     // Cache the response (don't cache guest home feed)
//     if (cacheKey && (mode !== 'home' || memberQid)) {
//       const cacheDuration = mode === 'author' ? AUTHOR_FEED_CACHE_DURATION :
//                           mode === 'genre' ? GENRE_FEED_CACHE_DURATION :
//                           FEED_CACHE_DURATION;
      
//       feedCache.set(cacheKey, {
//         data: response,
//         expiry: Date.now() + cacheDuration
//       });

//       // Limit cache size
//       if (feedCache.size > 100) {
//         const firstKey = feedCache.keys().next().value;
//         feedCache.delete(firstKey);
//       }
//     }

//     console.log(`✅ ${mode} feed built: ${batch.length} items, hasMore: ${hasMore}`);
//     return res.json(response);

//   } catch (err) {
//     console.error('Feed error:', err);
    
//     // Try to serve stale cache as fallback
//     if (cacheKey && feedCache.has(cacheKey)) {
//       console.log(`🔄 Serving stale feed from cache due to error`);
//       const cached = feedCache.get(cacheKey);
//       cached.data._stale = true;
//       return res.json(cached.data);
//     }
    
//     return res.status(500).json({ 
//       success: false,
//       error: 'Failed to fetch feed'
//     });
//   }
// }
// // New function: Build home feed with seed
// async function buildHomeFeedWithSeed(memberQid, seed, limit) {
//   try {
//     // First try to build personalized feed
//     const feed = await buildFeed({
//       memberQid: memberQid,
//       limit: limit
//     });
    
//     // Shuffle with seed for consistency
//     return shuffleBooks(feed, seed);
//   } catch (err) {
//     console.error('Error building home feed:', err);
    
//     // Fallback to trending with seed
//     return await buildSeededFeed(seed);
//   }
// }

// // Update buildExtendedFeed to accept seed parameter
// async function buildExtendedFeed({ memberQid, cursor, limit, seed = Date.now() }) {
//   console.log(`🔄 Extended feed for ${memberQid || 'guest'}: cursor=${cursor}, seed=${seed}, limit=${limit}`);
  
//   // Get user's top genres and authors
//   const [topGenres, topAuthors] = await Promise.all([
//     getPersonalizedGenres(memberQid, 10),
//     getPersonalizedAuthors(memberQid, 10)
//   ]);
  
//   // Determine which phase we're in based on cursor
//   const phaseSize = 30;
//   const phase = Math.floor(cursor / phaseSize) % 4;
  
//   let items = [];
  
//   try {
//     switch (phase) {
//       case 0: // Phase 1: Trending books
//         items = await getTrendingBooks(limit);
//         break;
        
//       case 1: // Phase 2: Genre-based
//         if (topGenres.length > 0) {
//           const randomGenre = getSeededRandomItem(topGenres, seed + cursor);
//           items = await buildGenreFeed(randomGenre.slug, limit);
//         } else {
//           const fallbackGenres = ['fiction', 'science', 'fantasy'];
//           const randomGenre = getSeededRandomItem(fallbackGenres, seed + cursor);
//           items = await buildGenreFeed(randomGenre, limit);
//         }
//         break;
        
//       case 2: // Phase 3: Author-based
//         if (topAuthors.length > 0) {
//           const randomAuthor = getSeededRandomItem(topAuthors, seed + cursor);
//           items = await buildAuthorFeed(randomAuthor.author_id, limit);
//         } else {
//           items = await getRandomBooks(limit);
//         }
//         break;
        
//       case 3: // Phase 4: Mixed recommendations
//         items = await getMixedRecommendations(memberQid, topGenres, topAuthors, limit);
//         break;
        
//       default:
//         items = await getRandomBooks(limit);
//     }
//   } catch (err) {
//     console.error(`Error in extended feed phase ${phase}:`, err);
//     items = await getRandomBooks(limit);
//   }
  
//   // Fill with random books if needed
//   if (items.length < limit) {
//     const additionalItems = await getRandomBooks(limit - items.length);
//     items = [...items, ...additionalItems];
//   }
  
//   // Shuffle with seed for consistency
//   const deduped = dedupeFeed(items);
//   const shuffled = shuffleBooks(deduped, seed + cursor);
  
//   return shuffled.slice(0, limit) || [];
// }

// // Helper: Get random item based on seed
// function getSeededRandomItem(array, seed) {
//   if (!array || array.length === 0) return null;
//   const random = mulberry32(seed);
//   const index = Math.floor(random() * array.length);
//   return array[index];
// }
// // --- EXPORTS ---

// module.exports = {
//   getAllTrending,
//   getFeed
// };