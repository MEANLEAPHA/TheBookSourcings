const { fetchJson } = require("../../../util/apiClient");

// Cache for Internet Archive book data
const archiveCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// Helper to clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of archiveCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      archiveCache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

async function getInternetArchiveBookById(req, res) {
  try {
    const { bookId } = req.params;
    
    const identifier = bookId.startsWith('ark:/') 
      ? bookId.replace('ark:/', '')
      : bookId;
    
    // CHECK CACHE FIRST
    if (archiveCache.has(identifier)) {
      const cached = archiveCache.get(identifier);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Serving from cache: ${identifier}`);
        return res.json({ book: cached.data });
      }
    }
    
    console.log(`🌐 Fetching from Internet Archive: ${identifier}`);
    
    const url = `https://archive.org/metadata/${identifier}`;
    const data = await fetchJson(url, { timeout: 8000 }); // 8 second timeout
    
    if (!data || !data.metadata) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const meta = data.metadata;
    
    // Get cover - use service image by default (fastest)
    let cover = `https://archive.org/services/img/${identifier}`;
    
    // Only search for cover if files array is small and we have time
    if (data.files && data.files.length < 30) {
      const coverFile = data.files.find(f => 
        f.name.toLowerCase().includes('cover') ||
        f.name.match(/^cover\.(jpg|jpeg|png|gif)$/i) ||
        f.name.match(/^\d{1,3}\.(jpg|jpeg|png|gif)$/i)
      );
      
      if (coverFile) {
        cover = `https://archive.org/download/${identifier}/${coverFile.name}`;
      }
    }
    
    // Get authors
    let authors = ["Unknown"];
    if (meta.creator) {
      if (Array.isArray(meta.creator)) {
        authors = meta.creator.slice(0, 3);
      } else if (typeof meta.creator === 'string') {
        const creator = meta.creator.substring(0, 100);
        if (creator.length > 50 && creator.includes(',')) {
          authors = [creator.split(',')[0].trim()];
        } else {
          authors = [creator.trim()];
        }
      }
    }
    
    // Get description
    let description = meta.description || null;
    if (description) {
      if (typeof description === 'object') {
        description = description.value || null;
      }
      if (description && description.length > 300) {
        description = description.substring(0, 300) + '...';
      }
      description = description?.replace(/<[^>]*>/g, ' ') || null;
    }
    
    // Get categories
    let categories = [];
    if (meta.subject) {
      if (Array.isArray(meta.subject)) {
        categories = meta.subject.slice(0, 5);
      } else if (typeof meta.subject === 'string') {
        categories = meta.subject.split(',').slice(0, 5).map(s => s.trim());
      }
    }
    
    // Get ISBN
    let ISBN_10 = null;
    let ISBN_13 = null;
    
    if (meta.isbn && typeof meta.isbn === 'string') {
      const cleanIsbn = meta.isbn.replace(/[-\s]/g, '');
      if (cleanIsbn.length === 10) ISBN_10 = cleanIsbn;
      if (cleanIsbn.length === 13) ISBN_13 = cleanIsbn;
    }
    
    const book = {
      source: "Internet Archive",
      bookId: identifier,
      title: meta.title || "Unknown Title",
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: description,
      cover: cover,
      categories: categories,
      language: meta.language || null,
      page: meta.page_count || meta.number_of_pages || null,
      ISBN_10: ISBN_10,
      ISBN_13: ISBN_13,
      publishDate: meta.date || meta.year || meta.publicdate || null,
      publisher: meta.publisher || null,
      read: `https://archive.org/details/${identifier}`,
      download: `https://archive.org/download/${identifier}`,
      _cached: true, // Indicate this can be cached
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    archiveCache.set(identifier, {
      data: book,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (archiveCache.size > 100) {
      const firstKey = archiveCache.keys().next().value;
      archiveCache.delete(firstKey);
    }
    
    console.log(`✅ Fetched and cached: ${identifier} (Cache size: ${archiveCache.size})`);
    res.json({ book });
    
  } catch (err) {
    if (err.message.includes('timeout')) {
      return res.status(504).json({ 
        error: "Internet Archive request timed out",
        suggestion: "Try again or use a different book ID"
      });
    }
    
    console.error("aboutInternetArchiveController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

// Optional: Add cache stats endpoint
// function getArchiveCacheStats(req, res) {
//   res.json({
//     cacheSize: archiveCache.size,
//     cacheKeys: Array.from(archiveCache.keys()),
//     cacheDuration: `${CACHE_DURATION / 60000} minutes`
//   });
// }

module.exports = { 
  getInternetArchiveBookById
  // getArchiveCacheStats
   // Optional
};