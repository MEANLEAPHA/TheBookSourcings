const { fetchJson } = require('../../../util/apiClient');
// Cache for Internet Archive trending
const internetArchiveTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 30 * 60 * 1000 // 30 minutes cache
};

async function getInternetArchiveTrending() {
  // Check cache first
  if (internetArchiveTrendingCache.data && 
      Date.now() - internetArchiveTrendingCache.timestamp < internetArchiveTrendingCache.duration) {
    console.log('📦 Serving Internet Archive trending from cache');
    return internetArchiveTrendingCache.data;
  }

  console.log('🌐 Fetching Internet Archive trending from API');
  
  try {
    const url = "https://archive.org/advancedsearch.php?q=mediatype:texts&output=json&rows=20&sort[]=week+desc&fl[]=identifier,title,creator,avg_rating,week";
    const data = await fetchJson(url);
    
    if (!data?.response?.docs) {
      // Return cached data even if stale, or empty array
      return internetArchiveTrendingCache.data || [];
    }
    
    const books = data.response.docs.map(doc => ({
      source: "internetarchive",
      bookId: doc.identifier,
      title: doc.title || "Unknown Title",
      authors: doc.creator ? (Array.isArray(doc.creator) ? doc.creator : [doc.creator]) : ["Unknown"],
      cover: `https://archive.org/services/img/${doc.identifier}`,
      viewsThisWeek: doc.week || 0
    }));

    // Update cache
    internetArchiveTrendingCache.data = books;
    internetArchiveTrendingCache.timestamp = Date.now();

    console.log(`✅ Internet Archive trending cached (${books.length} books)`);
    return books;
    
  } catch (error) {
    console.error('Internet Archive trending error:', error.message);
    // Return cached data even if stale, or empty array
    return internetArchiveTrendingCache.data || [];
  }
}

module.exports = {getInternetArchiveTrending};