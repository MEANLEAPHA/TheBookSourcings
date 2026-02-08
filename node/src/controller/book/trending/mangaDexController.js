const { fetchJson } = require('../../../util/apiClient');
// Cache for MangaDex trending
const mangaDexTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 20 * 60 * 1000 // 20 minutes cache (manga trends change faster)
};

// Helper function for cover URLs
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) {
    return '/api/proxy/placeholder?text=No+Cover&width=256&height=384';
  }
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function getMangaDexTrending() {
  // Check cache first
  if (mangaDexTrendingCache.data && 
      Date.now() - mangaDexTrendingCache.timestamp < mangaDexTrendingCache.duration) {
    console.log('📦 Serving MangaDex trending from cache');
    return mangaDexTrendingCache.data;
  }

  console.log('🌐 Fetching MangaDex trending from API');
  
  try {
    const url = "https://api.mangadex.org/manga?limit=20&order[followedCount]=desc&contentRating[]=safe&includes[]=cover_art&includes[]=author";
    const data = await fetchJson(url);
    
    if (!data?.data) {
      // Return cached data even if stale, or empty array
      return mangaDexTrendingCache.data || [];
    }
    
    const books = data.data.map(manga => {
      let coverUrl = null;
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
        }
      }
      
      // Use proxy for cover URL
      const cover = getCoverUrl(coverUrl, manga.id);
      
      // Get authors
      let authors = ["Unknown"];
      if (manga.relationships) {
        const authorRels = manga.relationships.filter(r => r.type === 'author');
        authors = authorRels.map(r => r.attributes?.name).filter(name => name);
      }
      
      const title = manga.attributes?.title?.en || 
                   manga.attributes?.title?.['ja-ro'] || 
                   Object.values(manga.attributes?.title || {})[0] || 
                   'Unknown Title';
      
      return {
        source: "mangadex",
        bookId: manga.id,
        title: title,
        authors: authors,
        cover: cover
      };
    });

    // Update cache
    mangaDexTrendingCache.data = books;
    mangaDexTrendingCache.timestamp = Date.now();

    console.log(`✅ MangaDex trending cached (${books.length} manga)`);
    return books;
    
  } catch (error) {
    console.error('MangaDex trending error:', error.message);
    // Return cached data even if stale, or empty array
    return mangaDexTrendingCache.data || [];
  }
}

module.exports = {getMangaDexTrending};