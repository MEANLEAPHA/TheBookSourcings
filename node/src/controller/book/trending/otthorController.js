const db = require("../../../config/db");
// Cache for Otthor trending
const otthorTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 10 * 60 * 1000 // 10 minutes cache (user uploads can change)
};

async function getOtthorTrending() {
  // Check cache first
  if (otthorTrendingCache.data && 
      Date.now() - otthorTrendingCache.timestamp < otthorTrendingCache.duration) {
    console.log('📦 Serving Otthor trending from cache');
    return otthorTrendingCache.data;
  }

  console.log('🌐 Fetching Otthor trending from database');
  
  try {
    const [books] = await db.query(`
      SELECT 
        b.bookQid,
        b.title,
        b.author,
        b.bookCover,
        b.viewCount,
        b.readCount,
        b.favoriteCount,
        b.shareCount,
        b.downloadCount,
        b.review_count,
        u.username
      FROM uploadBook b
      JOIN users u ON b.memberQid = u.memberQid
      ORDER BY (
        COALESCE(viewCount, 0) * 0.3 +
        COALESCE(readCount, 0) * 0.25 +
        COALESCE(review_count, 0) * 0.2 +
        COALESCE(shareCount, 0) * 0.1 +
        COALESCE(favoriteCount, 0) * 0.1 +
        COALESCE(downloadCount, 0) * 0.05
      ) DESC
      LIMIT 20
    `);

    if (!books || books.length === 0) {
      // Return cached data even if stale, or empty array
      return otthorTrendingCache.data || [];
    }

    const trendingBooks = books.map((book) => {
      // Calculate engagement score
      const engagementScore = (
        (book.viewCount || 0) * 0.3 +
        (book.readCount || 0) * 0.25 +
        (book.favoriteCount || 0) * 0.2 +
        (book.shareCount || 0) * 0.1 +
        (book.downloadCount || 0) * 0.1 +
        (book.review_count || 0) * 0.05
      ).toFixed(1);

      return {
        bookId: book.bookQid,
        title: book.title,
        authors: [book.author],
        cover: book.bookCover,
        source: book.username,
        engagement: parseFloat(engagementScore),
        stats: {
          views: book.viewCount || 0,
          reads: book.readCount || 0,
          favorites: book.favoriteCount || 0,
          downloads: book.downloadCount || 0
        }
      };
    });

    // Update cache
    otthorTrendingCache.data = trendingBooks;
    otthorTrendingCache.timestamp = Date.now();

    console.log(`✅ Otthor trending cached (${trendingBooks.length} books)`);
    return trendingBooks;
    
  } catch (error) {
    console.error('Otthor trending error:', error.message);
    // Return cached data even if stale, or empty array
    return otthorTrendingCache.data || [];
  }
}

module.exports = { getOtthorTrending };