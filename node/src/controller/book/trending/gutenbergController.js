// const { fetchJson } = require('../../../util/apiClient');
// // Cache for Gutenberg trending
// const gutenbergTrendingCache = {
//   data: null,
//   timestamp: 0,
//   duration: 30 * 60 * 1000 // 30 minutes cache
// };

// async function getGutenbergTrending() {
//   // Check cache
//   if (gutenbergTrendingCache.data && 
//       Date.now() - gutenbergTrendingCache.timestamp < gutenbergTrendingCache.duration) {
//     console.log('📦 Serving Gutenberg trending from cache');
//     return gutenbergTrendingCache.data;
//   }

//   console.log('🌐 Fetching Gutenberg trending from API');
  
//   try {
//     const url = "https://gutendex.com/books?sort=popular";
//     const data = await fetchJson(url);

//     if (!data || !data.results) {
//       // Even on error, keep old cache if available
//       return gutenbergTrendingCache.data || [];
//     }

//     const books = data.results.map(book => {
//       const authors = (book.authors || []).map(a => {
//         if (a.name.includes(",")) {
//           const [last, first] = a.name.split(",").map(s => s.trim());
//           return first && last ? `${first} ${last}` : a.name;
//         }
//         return a.name;
//       });

//       return {
//         source: "Project Gutenberg",
//         title: book.title,
//         authors,
//         cover: book.formats["image/jpeg"] || null,
//         bookId: book.id.toString()
//       };
//     });

//     // Update cache
//     gutenbergTrendingCache.data = books;
//     gutenbergTrendingCache.timestamp = Date.now();

//     console.log(`✅ Gutenberg trending cached (${books.length} books)`);
//     return books;

//   } catch (error) {
//     console.error('Gutenberg trending error:', error.message);
//     // Return cached data even if stale, or empty array
//     return gutenbergTrendingCache.data || [];
//   }
// }

// module.exports = {
//   getGutenbergTrending
// };
const { fetchJson } = require('../../../util/apiClient');

// Cache for Gutenberg trending - increased duration since we're fetching more data
const gutenbergTrendingCache = {
  data: null,
  timestamp: 0,
  duration: 60 * 60 * 1000 // 60 minutes cache (increased from 30)
};

async function getGutenbergTrending(maxPages = 5) {
  // Check cache
  if (gutenbergTrendingCache.data && 
      Date.now() - gutenbergTrendingCache.timestamp < gutenbergTrendingCache.duration) {
    console.log('📦 Serving Gutenberg trending from cache');
    return gutenbergTrendingCache.data;
  }

  console.log(`🌐 Fetching Gutenberg trending from API (up to ${maxPages} pages)`);
  
  try {
    let allBooks = [];
    let nextUrl = "https://gutendex.com/books?sort=popular";
    let pageCount = 0;
    
    // Fetch pages until we reach maxPages or no more pages
    while (nextUrl && pageCount < maxPages) {
      console.log(`  Fetching page ${pageCount + 1}...`);
      const data = await fetchJson(nextUrl);
      
      if (!data || !data.results) {
        console.warn(`  No results on page ${pageCount + 1}, stopping`);
        break;
      }

      // Process books from this page
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
      
      allBooks = allBooks.concat(books);
      pageCount++;
      
      // Get next page URL from response (Gutendex provides this) [citation:1][citation:6]
      nextUrl = data.next;
      
      // Small delay to be nice to the API (optional)
      if (nextUrl && pageCount < maxPages) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Gutenberg trending cached (${allBooks.length} books from ${pageCount} pages)`);

    // Update cache
    gutenbergTrendingCache.data = allBooks;
    gutenbergTrendingCache.timestamp = Date.now();

    return allBooks;

  } catch (error) {
    console.error('Gutenberg trending error:', error.message);
    // Return cached data even if stale, or empty array
    return gutenbergTrendingCache.data || [];
  }
}

module.exports = {
  getGutenbergTrending
};