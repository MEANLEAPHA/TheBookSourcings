// module.exports = { getMangaDexBookById };
const { fetchJson } = require("../../../util/apiClient");

// Cache for MangaDex book data
const mangaDexCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of mangaDexCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      mangaDexCache.delete(key);
    }
  }
}, 60 * 1000);

// Helper function for cover URLs
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) return null;
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function getMangaDexBookById(req, res) {
  try {
    const { bookId } = req.params;
    
    // CHECK CACHE FIRST
    if (mangaDexCache.has(bookId)) {
      const cached = mangaDexCache.get(bookId);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 MangaDex cache hit: ${bookId}`);
        return res.json({ book: cached.data });
      }
    }

    console.log(`🌐 Fetching MangaDex: ${bookId}`);
    const url = `https://api.mangadex.org/manga/${bookId}?includes[]=cover_art&includes[]=author`;
    const data = await fetchJson(url, { timeout: 7000 });

    if (!data || !data.data) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const manga = data.data;
    
    // Get cover image
    let coverUrl = null;
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        coverUrl = `https://uploads.mangadex.org/covers/${bookId}/${coverRel.attributes.fileName}`;
      }
    }
    
    // Get authors
    let authors = ["Unknown Author"];
    if (manga.relationships) {
      const authorRels = manga.relationships.filter(r => r.type === 'author');
      authors = authorRels
        .map(r => r.attributes?.name)
        .filter(name => name && name !== 'Unknown')
        .slice(0, 3); // Limit to 3 authors
    }
    
    // Get title
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 manga.attributes?.title?.ja ||
                 manga.attributes?.title?.ko ||
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';

    // Get description
    let description = manga.attributes?.description?.en || 
                     manga.attributes?.description?.['ja-ro'] || 
                     manga.attributes?.description?.ja || 
                     null;
    
    // Clean description
    if (description && description.length > 300) {
      description = description.substring(0, 300) + '...';
    }
    if (description) {
      description = description.replace(/<[^>]*>/g, ' ').trim();
    }

    // Get genres
    const categories = manga.attributes?.tags
      ?.filter(tag => tag.attributes.group === 'genre')
      ?.map(tag => tag.attributes.name.en || tag.attributes.name.ja)
      ?.filter(name => name)
      ?.slice(0, 5) || []; // Limit to 5 genres

    // Get additional metadata
    const status = manga.attributes?.status || 'ongoing';
    const contentRating = manga.attributes?.contentRating || 'safe';
    const year = manga.attributes?.year || null;
    const isLocked = manga.attributes?.isLocked || false;

    const book = {
      source: "MangaDex",
      bookId: manga.id,
      title: title,
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: description,
      cover: getCoverUrl(coverUrl, manga.id),
      categories: categories,
      language: manga.attributes?.originalLanguage || null,
      page: null,
      ISBN_10: null,
      ISBN_13: null,
      publishDate: year,
      publisher: null,
      read: `https://mangadex.org/title/${manga.id}`,
      download: null,
      // MangaDex specific fields
      _mangadex: {
        status: status,
        contentRating: contentRating,
        isLocked: isLocked,
        lastVolume: manga.attributes?.lastVolume,
        lastChapter: manga.attributes?.lastChapter,
        availableTranslatedLanguages: manga.attributes?.availableTranslatedLanguages || []
      },
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    mangaDexCache.set(bookId, {
      data: book,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (mangaDexCache.size > 150) {
      const firstKey = mangaDexCache.keys().next().value;
      mangaDexCache.delete(firstKey);
    }

    console.log(`✅ MangaDex fetched and cached: ${bookId} (Cache size: ${mangaDexCache.size})`);
    res.json({ book });
  } catch (err) {
    console.error("aboutMangaDexController.js Error:", err.message);
    
    // Try to serve from cache even if stale on error
    if (mangaDexCache.has(bookId)) {
      console.log(`🔄 MangaDex serving stale cache due to error: ${bookId}`);
      const cached = mangaDexCache.get(bookId);
      cached.data._stale = true;
      return res.json({ book: cached.data });
    }
    
    if (err.message.includes('timeout')) {
      return res.status(504).json({ 
        error: "MangaDex request timed out",
        suggestion: "Try again in a moment"
      });
    }
    
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

// Cache stats endpoint (optional)
// function getMangaDexCacheStats(req, res) {
//   res.json({
//     cacheSize: mangaDexCache.size,
//     cacheDuration: `${CACHE_DURATION / 60000} minutes`,
//     cacheKeys: Array.from(mangaDexCache.keys()).slice(0, 10)
//   });
// }

module.exports = { 
  getMangaDexBookById
  // getMangaDexCacheStats
   // Optional
};