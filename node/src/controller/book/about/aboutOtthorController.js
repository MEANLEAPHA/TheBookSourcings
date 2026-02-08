const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

// Cache for Otthor book data
const otthorCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otthorCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      otthorCache.delete(key);
    }
  }
}, 60 * 1000);

const getOtthorById = async (req, res) => {
  try {
    const { bookId } = req.params;
    
    // CHECK CACHE FIRST
    if (otthorCache.has(bookId)) {
      const cached = otthorCache.get(bookId);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Otthor cache hit: ${bookId}`);
        return res.json(cached.data);
      }
    }

    console.log(`🌐 Fetching Otthor from DB: ${bookId}`);
    
    const [rows] = await db.query(
      `SELECT 
        b.bookQid,
        b.memberQid,
        b.author,
        b.bookCover,
        b.title,
        b.subTitle,
        b.mainCategory,
        b.genre,
        b.viewCount,
        b.UploadAt,
        b.summary,
        b.language,
        b.pageCount,
        b.ISBN10,
        b.ISBN13,
        b.publishDate,
        b.publisher,
        b.bookFile,
        b.authorId,
        u.username,
        u.authorQid,
        u.memberQid,
        u.pfUrl,
        u.followerCount
      FROM uploadBook b
      JOIN users u ON b.memberQid = u.memberQid
      WHERE b.bookQid = ?`,
      [bookId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No user book found",
        result: false,
      });
    }

    const bookRow = rows[0];

    // Parse authorId safely
    let authorIdArray = [];
    try {
      authorIdArray = JSON.parse(bookRow.authorId || "[]");
    } catch {
      authorIdArray = [];
    }

    // Parse genre safely
    let genreArray = [];
    if (bookRow.genre) {
      try {
        genreArray = bookRow.genre.split(",").map(g => g.trim()).filter(g => g);
      } catch {
        genreArray = [];
      }
    }

    // Format publish date
    let publishDate = null;
    if (bookRow.publishDate) {
      try {
        const date = new Date(bookRow.publishDate);
        if (!isNaN(date.getTime())) {
          publishDate = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
        }
      } catch {
        publishDate = null;
      }
    }

    const book = {
      pfUrl: bookRow.pfUrl,
      followerCount: bookRow.followerCount,
      bookQid: bookRow.bookQid,
      title: bookRow.title,
      subtitle: bookRow.subTitle,
      author: bookRow.author,
      authorIds: authorIdArray,
      author_id: authorIdArray,
      description: bookRow.summary,
      cover: bookRow.bookCover,
      categories: bookRow.mainCategory,
      genre: genreArray,
      language: bookRow.language,
      page: bookRow.pageCount,
      ISBN_10: bookRow.ISBN10,
      ISBN_13: bookRow.ISBN13,
      publishDate: publishDate,
      publisher: bookRow.publisher,
      read: bookRow.bookFile,
      download: bookRow.bookFile,
      views: bookRow.viewCount,
      uploaded: dayjs(bookRow.UploadAt).fromNow(),
      username: bookRow.username,
      channel: bookRow.memberQid,
      // Add cache metadata
      _cached: true,
      _fetchedAt: new Date().toISOString(),
      _source: "database"
    };

    // STORE IN CACHE
    otthorCache.set(bookId, {
      data: book,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (otthorCache.size > 200) {
      const firstKey = otthorCache.keys().next().value;
      otthorCache.delete(firstKey);
    }

    console.log(`✅ Otthor fetched and cached: ${bookId} (Cache size: ${otthorCache.size})`);
    res.json(book);
    
  } catch (err) {
    console.error("getOtthorById error:", err.message);
    
    // Try to serve from cache even if stale on error
    if (otthorCache.has(bookId)) {
      console.log(`🔄 Otthor serving stale cache due to error: ${bookId}`);
      const cached = otthorCache.get(bookId);
      cached.data._stale = true;
      return res.json(cached.data);
    }
    
    res.status(500).json({
      message: "Internal server error. Our team is working to fix it as soon as possible. Sorry!",
      error: err.message,
    });
  }
};

// Optional: Cache stats endpoint
function getOtthorCacheStats(req, res) {
  res.json({
    cacheSize: otthorCache.size,
    cacheDuration: `${CACHE_DURATION / 60000} minutes`,
    cacheKeys: Array.from(otthorCache.keys()).slice(0, 10)
  });
}

module.exports = { 
  getOtthorById,
  getOtthorCacheStats // Optional
};