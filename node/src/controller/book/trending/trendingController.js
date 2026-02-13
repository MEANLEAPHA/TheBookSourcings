
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
    const cursor = Math.max(0, Number(req.query.cursor || 0));
    const limit = Math.min(50, Number(req.query.limit || 50));

    const data = await buildSeededFeed(seed);
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
async function buildSeededFeed(seed) {
  
  // Fetch all trending sources in parallel
  console.log('🌍 Fetching trending sources...');
  const [gutenberg, openLibrary, otthor, mangaDex, internetArchive] =
    await Promise.allSettled([
      getGutenbergTrending(),
      getOpenLibraryTrending(),
      getOtthorTrending(),
      getMangaDexTrending(),
      getInternetArchiveTrending()
    ]);

  // Extract values from promises (only fulfilled ones)
  const gutenbergBooks = gutenberg.status === 'fulfilled' ? (gutenberg.value || []) : [];
  const openLibraryBooks = openLibrary.status === 'fulfilled' ? (openLibrary.value || []) : [];
  const otthorBooks = otthor.status === 'fulfilled' ? (otthor.value || []) : [];
  const mangaDexBooks = mangaDex.status === 'fulfilled' ? (mangaDex.value || []) : [];
  const internetArchiveBooks = internetArchive.status === 'fulfilled' ? (internetArchive.value || []) : [];

  console.log(`📊 Trending sources:`);
  console.log(`   Gutenberg: ${gutenbergBooks.length} books`);
  console.log(`   OpenLibrary: ${openLibraryBooks.length} books`);
  console.log(`   Otthor: ${otthorBooks.length} books`);
  console.log(`   MangaDex: ${mangaDexBooks.length} books`);
  console.log(`   Internet Archive: ${internetArchiveBooks.length} books`);

  // Combine all books - FIXED SYNTAX
  const allBooks = [
    ...gutenbergBooks,
    ...openLibraryBooks,
    ...otthorBooks,
    ...mangaDexBooks,
    ...internetArchiveBooks
  ].filter(b => {
    const isValid = b && b.title && b.bookId;
    if (!isValid && b) {
      console.log(`⚠️ Invalid book skipped:`, { 
        hasTitle: !!b.title, 
        hasBookId: !!b.bookId,
        source: b.source,
        id: b.bookId 
      });
    }
    return isValid;
  });

  console.log(`📊 Total books after filtering: ${allBooks.length}`);
  
  // Shuffle with seed
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

  console.log(`✅ Trending feed built and cached for ${memberQid || 'guest'} (${mixed.length} books)`);
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


