
// const { fetchJson } = require('../../../util/apiClient');
// async function getOpenLibraryTrending() {
//   const url = "https://openlibrary.org/trending/daily.json";
//   const data = await fetchJson(url);

//   if (!data?.works) return [];

//   return data.works.map(book => ({
//     source: "openlibrary",
//     bookId: book.key.replace("/works/", ""),
//     title: book.title,
//     authors: book.author_name || [],
//     cover: book.cover_i
//       ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
//       : null
//   }));
// }


// // Export the function using CommonJS
// module.exports = {
//   getOpenLibraryTrending
// };
const { fetchJson } = require('../../../util/apiClient');

// Cache for Open Library trending
const openLibraryTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 30 * 60 * 1000 // 30 minutes cache
};

async function getOpenLibraryTrending() {
  // Check cache first
  if (openLibraryTrendingCache.data && 
      Date.now() - openLibraryTrendingCache.timestamp < openLibraryTrendingCache.duration) {
    console.log('📦 Serving Open Library trending from cache');
    return openLibraryTrendingCache.data;
  }

  console.log('🌐 Fetching Open Library trending from API');
  
  try {
    const url = "https://openlibrary.org/trending/daily.json";
    const data = await fetchJson(url);

    if (!data?.works) {
      // Return cached data even if stale, or empty array
      return openLibraryTrendingCache.data || [];
    }

    const books = data.works.map(book => ({
      source: "openlibrary",
      bookId: book.key.replace("/works/", ""),
      title: book.title,
      authors: book.author_name || [],
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : null
    }));

    // Update cache
    openLibraryTrendingCache.data = books;
    openLibraryTrendingCache.timestamp = Date.now();

    console.log(`✅ Open Library trending cached (${books.length} books)`);
    return books;
    
  } catch (error) {
    console.error('Open Library trending error:', error.message);
    // Return cached data even if stale, or empty array
    return openLibraryTrendingCache.data || [];
  }
}

module.exports = {
  getOpenLibraryTrending
};