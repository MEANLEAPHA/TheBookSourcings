// module.exports = { getGutenbergBookById };
const { fetchJson } = require("../../../util/apiClient");

// Cache for Gutenberg book data
const gutenbergCache = new Map();
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes cache (Gutenberg is stable)

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of gutenbergCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      gutenbergCache.delete(key);
    }
  }
}, 60 * 1000);

async function getGutenbergBookById(req, res) {
  try {
    const { bookId } = req.params;
    
    // CHECK CACHE FIRST
    if (gutenbergCache.has(bookId)) {
      const cached = gutenbergCache.get(bookId);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Gutenberg cache hit: ${bookId}`);
        return res.json({ book: cached.data });
      }
    }

    console.log(`🌐 Fetching Gutenberg: ${bookId}`);
    const url = `https://gutendex.com/books/${bookId}`;
    const data = await fetchJson(url, { timeout: 5000 });

    if (!data || !data.id) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    // Format authors as "First Last"
    const authorsArray = data.authors?.map(a => a.name) || [];
    const authors = authorsArray
      .map(name => {
        if (name.includes(",")) {
          const [last, first] = name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : name;
        }
        return name;
      })
      .join(", ") || "Unknown";

    // Clean categories
    let categories = [];
    if (data.subjects) {
      categories = data.subjects.map(cat => 
        cat.replace(/--+/g, ", ")
           .replace(/\s+/g, " ")
           .trim()
      );
    }

    // Get download links
    const formats = data.formats || {};
    let read = formats["text/html"] || 
               formats["text/plain"] || 
               formats["text/plain; charset=utf-8"] ||
               null;
    
    let download = formats["application/epub+zip"] || 
                   formats["application/pdf"] ||
                   formats["text/plain"] ||
                   null;

    const book = {
      source: "Project Gutenberg",
      bookId: data.id.toString(),
      title: data.title || null,
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: data.summaries?.[0] || null,
      cover: formats["image/jpeg"] || 
             formats["image/png"] || 
             null,
      categories: categories,
      language: data.languages?.[0] || null,
      page: null,
      ISBN_10: null,
      ISBN_13: null,
      publishDate: data?.copyright || null,
      publisher: null,
      read: read,
      download: download,
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    gutenbergCache.set(bookId, {
      data: book,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (gutenbergCache.size > 200) {
      const firstKey = gutenbergCache.keys().next().value;
      gutenbergCache.delete(firstKey);
    }

    console.log(`✅ Gutenberg fetched and cached: ${bookId} (Cache size: ${gutenbergCache.size})`);
    res.json({ book });
  } catch (err) {
    console.error("aboutGutenbergController.js Error:", err.message);
    
    // Try to serve from cache even if stale on error
    if (gutenbergCache.has(bookId)) {
      console.log(`🔄 Gutenberg serving stale cache due to error: ${bookId}`);
      const cached = gutenbergCache.get(bookId);
      cached.data._stale = true;
      return res.json({ book: cached.data });
    }
    
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

// Cache stats endpoint (optional)
// function getGutenbergCacheStats(req, res) {
//   res.json({
//     cacheSize: gutenbergCache.size,
//     cacheDuration: `${CACHE_DURATION / 60000} minutes`,
//     cacheKeys: Array.from(gutenbergCache.keys()).slice(0, 10)
//   });
// }

module.exports = { 
  getGutenbergBookById
  // getGutenbergCacheStats 
  // Optional
};