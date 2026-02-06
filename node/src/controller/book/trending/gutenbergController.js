// const { fetchJson } = require('../../../util/apiClient');
// async function getGutenbergTrending() {
//   const url = "https://gutendex.com/books?sort=popular";
//   const data = await fetchJson(url);

//   if (!data || !data.results) return [];

//   return data.results.map(book => {
    
//     const authors = (book.authors || []).map(a => {
//       if (a.name.includes(",")) {
//         const [last, first] = a.name.split(",").map(s => s.trim());
//         return first && last ? `${first} ${last}` : a.name;
//       }
//       return a.name;
//     });

//     return {
//       source: "Project Gutenberg",
//       title: book.title,
//       authors,
//       cover: book.formats["image/jpeg"] || null,
//       // categories: book.subjects || [],
//       bookId: book.id
//     };
//   });
// }

// // Export the function using CommonJS
// module.exports = {
//   getGutenbergTrending
// };
const { fetchJson } = require('../../../util/apiClient');

// Cache for Gutenberg trending
const gutenbergTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 30 * 60 * 1000 // 30 minutes cache
};

async function getGutenbergTrending() {
  // Check cache
  if (gutenbergTrendingCache.data && 
      Date.now() - gutenbergTrendingCache.timestamp < gutenbergTrendingCache.duration) {
    console.log('📦 Serving Gutenberg trending from cache');
    return gutenbergTrendingCache.data;
  }

  console.log('🌐 Fetching Gutenberg trending from API');
  
  try {
    const url = "https://gutendex.com/books?sort=popular";
    const data = await fetchJson(url);

    if (!data || !data.results) {
      // Even on error, keep old cache if available
      return gutenbergTrendingCache.data || [];
    }

    const books = data.results.map(book => {
      const authors = (book.authors || []).map(a => {
        if (a.name.includes(",")) {
          const [last, first] = a.name.split(",").map(s => s.trim());
          return first && last ? `${first} ${last}` : a.name;
        }
        return a.name;
      });

      return {
        source: "Project Gutenberg",
        title: book.title,
        authors,
        cover: book.formats["image/jpeg"] || null,
        bookId: book.id.toString()
      };
    });

    // Update cache
    gutenbergTrendingCache.data = books;
    gutenbergTrendingCache.timestamp = Date.now();

    console.log(`✅ Gutenberg trending cached (${books.length} books)`);
    return books;

  } catch (error) {
    console.error('Gutenberg trending error:', error.message);
    // Return cached data even if stale, or empty array
    return gutenbergTrendingCache.data || [];
  }
}

module.exports = {
  getGutenbergTrending
};