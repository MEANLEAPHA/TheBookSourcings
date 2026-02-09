// const { fetchJson } = require('../../../../util/apiClient');
// async function searchGutenbergByAuthor(query) {
//   try {
//     if (!query) return [];

//     const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}&page=1`;

//     console.log(`🔍 Gutenberg URL: ${url}`);
    
//     const data = await fetchJson(url);
    
//     return (data.results || []).map(book => ({
//       bookId: book.id.toString(),
//       title: book.title,
//       authors: book.authors?.map(a => a.name) || [],
//       cover: book.formats?.['image/jpeg'] || 
//              book.formats?.['image/jpg'] || 
//              book.formats?.['image/png'] || null,
//       source: 'gutenberg',
//       genre: book.subjects?.[0] || null
//     }));
//   } catch (error) {
//     console.error('Gutenberg author search error:', error.message);
//     return [];
//   }
// }

// async function searchGutenbergByGenre(query) {
//   try {
//     if (!query) return [];

//     const url = `https://gutendex.com/books?topic=${encodeURIComponent(query)}&page=1`;

//     console.log(`🔍 Gutenberg Genre URL: ${url}`);
    
//     const data = await fetchJson(url);
    
//     return (data.results || []).map(book => ({
//       bookId: book.id.toString(),
//       title: book.title,
//       authors: book.authors?.map(a => a.name) || [],
//       cover: book.formats?.['image/jpeg'] || 
//              book.formats?.['image/jpg'] || 
//              book.formats?.['image/png'] || null,
//       source: 'gutenberg',
//       genre: book.subjects?.[0] || query
//     }));
//   } catch (error) {
//     console.error('Gutenberg genre search error:', error.message);
//     return [];
//   }
// }

// module.exports = {
//   searchGutenbergByAuthor,
//   searchGutenbergByGenre
// };

const { fetchJson } = require('../../../../util/apiClient');

// Cache
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 1000;
const cache = new Map();

// Helper functions
function generateCacheKey(endpoint, query) {
  return `gutenberg:${endpoint}:${query.toLowerCase().trim()}`;
}

async function withCache(cacheKey, fetchFunction) {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && now < cached.expiry) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  
  cache.set(cacheKey, {
    data,
    expiry: now + CACHE_TTL
  });
  
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  return data;
}

async function searchGutenbergByAuthor(query) {
  try {
    if (!query) return [];

    const cacheKey = generateCacheKey('author', query);
    
    return await withCache(cacheKey, async () => {
      const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}&page=1`;

      console.log(`🔍 Gutenberg URL: ${url}`);
      
      const data = await fetchJson(url);
      
      return (data.results || []).map(book => ({
        bookId: book.id.toString(),
        title: book.title,
        authors: book.authors?.map(a => a.name) || [],
        cover: book.formats?.['image/jpeg'] || 
               book.formats?.['image/jpg'] || 
               book.formats?.['image/png'] || null,
        source: 'gutenberg',
        genre: book.subjects?.[0] || null
      }));
    });
  } catch (error) {
    console.error('Gutenberg author search error:', error.message);
    return [];
  }
}

async function searchGutenbergByGenre(query) {
  try {
    if (!query) return [];

    const cacheKey = generateCacheKey('genre', query);
    
    return await withCache(cacheKey, async () => {
      const url = `https://gutendex.com/books?topic=${encodeURIComponent(query)}&page=1`;

      console.log(`🔍 Gutenberg Genre URL: ${url}`);
      
      const data = await fetchJson(url);
      
      return (data.results || []).map(book => ({
        bookId: book.id.toString(),
        title: book.title,
        authors: book.authors?.map(a => a.name) || [],
        cover: book.formats?.['image/jpeg'] || 
               book.formats?.['image/jpg'] || 
               book.formats?.['image/png'] || null,
        source: 'gutenberg',
        genre: book.subjects?.[0] || query
      }));
    });
  } catch (error) {
    console.error('Gutenberg genre search error:', error.message);
    return [];
  }
}

module.exports = {
  searchGutenbergByAuthor,
  searchGutenbergByGenre
};