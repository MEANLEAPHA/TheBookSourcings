// service/personalizedFeedService.js
const db = require('../../config/db');
const { buildGenreFeed } = require('../../model/helper/feedBygenre.model');
const { buildAuthorFeed } = require('../../model/helper/feedByauthor.model');
const { getTopGenresForUser, getTopAuthorsForUser } = require('../../model/nav.model');

// Cache for personalized feeds
const personalizedFeedCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Background job queue
const feedJobs = new Map();
let isProcessing = false;

async function preCachePersonalizedFeed(memberQid) {
  const cacheKey = `personalized:${memberQid}`;
  
  // Start background job immediately
  if (!feedJobs.has(memberQid)) {
    feedJobs.set(memberQid, {
      status: 'pending',
      timestamp: Date.now()
    });
    
    // Process in background
    processPersonalizedFeed(memberQid, cacheKey).finally(() => {
      feedJobs.delete(memberQid);
    });
  }
  
  // Return existing cache or empty array while building
  const existing = personalizedFeedCache.get(cacheKey);
  return existing?.data || [];
}

async function processPersonalizedFeed(memberQid, cacheKey) {
  console.log(`🔄 Background building personalized feed for ${memberQid}`);
  
  try {
    // Get user's top genres and authors in parallel
    const [topGenres, topAuthors] = await Promise.all([
      getTopGenresForUser(memberQid, 15),
      getTopAuthorsForUser(memberQid, 10)
    ]);
    
    // Build all genre and author feeds in BATCHES (not all at once)
    const BATCH_SIZE = 5;
    let allBooks = [];
    
    // Process genres in batches
    for (let i = 0; i < topGenres.length; i += BATCH_SIZE) {
      const batch = topGenres.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(g => buildGenreFeed(g.slug, 10).catch(() => []))
      );
      allBooks = allBooks.concat(...batchResults);
      
      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < topGenres.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Process authors in batches
    for (let i = 0; i < topAuthors.length; i += BATCH_SIZE) {
      const batch = topAuthors.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(a => buildAuthorFeed(a.author_id, 10).catch(() => []))
      );
      allBooks = allBooks.concat(...batchResults);
      
      if (i + BATCH_SIZE < topAuthors.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Deduplicate and cache
    const { deduplicateBooks } = require('../util/deduplicate');
    const uniqueBooks = deduplicateBooks(allBooks);
    
    personalizedFeedCache.set(cacheKey, {
      data: uniqueBooks.slice(0, 200),
      expiry: Date.now() + CACHE_DURATION
    });
    
    console.log(`✅ Background feed built for ${memberQid}: ${uniqueBooks.length} books`);
  } catch (error) {
    console.error(`❌ Background feed failed for ${memberQid}:`, error.message);
  }
}

// Get cached personalized feed
async function getPersonalizedFeed(memberQid, limit = 100) {
  if (!memberQid) return [];
  
  const cacheKey = `personalized:${memberQid}`;
  const cached = personalizedFeedCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expiry) {
    console.log(`📦 Serving cached personalized feed for ${memberQid}`);
    return cached.data.slice(0, limit);
  }
  
  // Trigger background rebuild and return empty/old data
  preCachePersonalizedFeed(memberQid);
  
  // Return stale cache if available
  if (cached) {
    console.log(`⚠️ Serving stale personalized feed for ${memberQid}`);
    return cached.data.slice(0, limit);
  }
  
  return [];
}

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of personalizedFeedCache.entries()) {
    if (now > value.expiry) {
      personalizedFeedCache.delete(key);
    }
  }
}, 60 * 1000);

module.exports = {
  getPersonalizedFeed,
  preCachePersonalizedFeed
};