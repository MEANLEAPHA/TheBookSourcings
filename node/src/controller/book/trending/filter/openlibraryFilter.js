// const { fetchJson } = require('../../../../util/apiClient');
// async function searchOpenLibraryByGenre(query, limit = 20) {
//   try {
//     if (!query) return [];

//     const url = `https://openlibrary.org/subjects/${encodeURIComponent(query.toLowerCase())}.json?limit=${limit}`;

//     console.log(`🔍 Open Library Genre URL: ${url}`);
    
//     const data = await fetchJson(url);
    
//     if (!data.works) return [];
    
//     return data.works.map((w) => {
//       let cover = null;
//       if (w.cover_id) {
//         cover = `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`;
//       } else if (w.cover_edition_key) {
//         cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
//       }

//       return {
//         bookId: w.key?.replace("/works/", "") || w.key,
//         title: w.title || 'Unknown Title',
//         cover,
//         authors: w.authors?.[0]?.name || "Unknown",
//         source: "openlibrary",
//         genre: w.subject?.[0] || query
//       };
//     });
//   } catch (error) {
//     console.error('Open Library genre search error:', error.message);
//     return [];
//   }
// }

// async function searchOpenLibraryByAuthor(query, limit = 20) {
//   try {
//     if (!query) return [];

//     const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&limit=${limit}`;

//     console.log(`🔍 Open Library Author URL: ${url}`);
    
//     const data = await fetchJson(url);
    
//     return (data.docs || []).map(book => ({
//       bookId: book.key || book.edition_key?.[0] || '',
//       title: book.title || 'Unknown Title',
//       authors: book.author_name || [],
//       cover: book.cover_i
//         ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
//         : (book.cover_edition_key 
//             ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`
//             : null),
//       source: 'openlibrary',
//       genre: book.subject?.[0] || null
//     }));
//   } catch (error) {
//     console.error('Open Library author search error:', error.message);
//     return [];
//   }
// }

// module.exports = {
//   searchOpenLibraryByGenre,
//   searchOpenLibraryByAuthor
// };
const { fetchJson } = require('../../../../util/apiClient');

// Cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 1000;
const cache = new Map();

// Helper functions for cache
function generateCacheKey(endpoint, query, limit = 20) {
  return `openlibrary:${endpoint}:${query.toLowerCase().trim()}:${limit}`;
}

async function withCache(cacheKey, fetchFunction) {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && now < cached.expiry) {
    console.log(`📚 [OpenLibrary Cache Hit] ${cacheKey}`);
    return cached.data;
  }
  
  console.log(`⚡ [OpenLibrary Cache Miss] ${cacheKey}`);
  const data = await fetchFunction();
  
  cache.set(cacheKey, {
    data,
    expiry: now + CACHE_TTL
  });
  
  // Clean up if cache gets too large
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  return data;
}

async function searchOpenLibraryByGenre(query, limit = 20) {
  try {
    if (!query) return [];

    const cacheKey = generateCacheKey('genre', query, limit);
    
    return await withCache(cacheKey, async () => {
      const url = `https://openlibrary.org/subjects/${encodeURIComponent(query.toLowerCase())}.json?limit=${limit}`;

      console.log(`🔍 Open Library Genre URL: ${url}`);
      
      const data = await fetchJson(url);
      
      if (!data.works) return [];
      
      return data.works.map((w) => {
        let cover = null;
        if (w.cover_id) {
          cover = `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`;
        } else if (w.cover_edition_key) {
          cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
        }

        return {
          bookId: w.key?.replace("/works/", "") || w.key,
          title: w.title || 'Unknown Title',
          cover,
          authors: w.authors?.[0]?.name || "Unknown",
          source: "openlibrary",
          genre: w.subject?.[0] || query
        };
      });
    });
  } catch (error) {
    console.error('Open Library genre search error:', error.message);
    return [];
  }
}

async function searchOpenLibraryByAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    const cacheKey = generateCacheKey('author', query, limit);
    
    return await withCache(cacheKey, async () => {
      const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&limit=${limit}`;

      console.log(`🔍 Open Library Author URL: ${url}`);
      
      const data = await fetchJson(url);
      
      return (data.docs || []).map(book => ({
        bookId: book.key || book.edition_key?.[0] || '',
        title: book.title || 'Unknown Title',
        authors: book.author_name || [],
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : (book.cover_edition_key 
              ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`
              : null),
        source: 'openlibrary',
        genre: book.subject?.[0] || null
      }));
    });
  } catch (error) {
    console.error('Open Library author search error:', error.message);
    return [];
  }
}

module.exports = {
  searchOpenLibraryByGenre,
  searchOpenLibraryByAuthor
};