
// const { fetchJson } = require("../../../util/apiClient");
// const db = require("../../../config/db");

// // Controller: Get similar books from 5 sources
// async function getSimilarBooks(req, res) {
//   const category = req.params.category;
  
//   if (!category) return res.status(400).json({ error: "Category is required" });

//   try {
//     // Fetch all sources in parallel for better performance
//     const [otthorBooks, olBooks, gutenBooks, mangaDexBooks, archiveBooks] = await Promise.allSettled([
//       getOtthorBooks(category),
//       getOpenLibraryBooks(category),
//       getGutenbergBooks(category),
//       getMangaDexBooks(category),
//       getInternetArchiveBooks(category)
//     ]);

//     // Combine results
//     const similarBooks = [
//       ...(otthorBooks.status === 'fulfilled' ? otthorBooks.value : []),
//       ...(olBooks.status === 'fulfilled' ? olBooks.value : []),
//       ...(gutenBooks.status === 'fulfilled' ? gutenBooks.value : []),
//       ...(mangaDexBooks.status === 'fulfilled' ? mangaDexBooks.value : []),
//       ...(archiveBooks.status === 'fulfilled' ? archiveBooks.value : [])
//     ];

//     // Shuffle and limit to reasonable number
//     const shuffled = similarBooks.sort(() => Math.random() - 0.5).slice(0, 20);

//     res.json({ 
//       category, 
//       results: shuffled,
//       sourcesFound: {
//         otthor: otthorBooks.status === 'fulfilled' ? otthorBooks.value.length : 0,
//         openlibrary: olBooks.status === 'fulfilled' ? olBooks.value.length : 0,
//         gutenberg: gutenBooks.status === 'fulfilled' ? gutenBooks.value.length : 0,
//         mangadex: mangaDexBooks.status === 'fulfilled' ? mangaDexBooks.value.length : 0,
//         internetarchive: archiveBooks.status === 'fulfilled' ? archiveBooks.value.length : 0
//       }
//     });
//   } catch (err) {
//     console.error("Similar books error:", err.message);
//     res.status(500).json({ error: "Failed to fetch similar books" });
//   }
// }

// // Helper: Otthor Books 
// async function getOtthorBooks(category){
//   try {
//     const [rows] = await db.query(
//       `SELECT 
//         bookQid,
//         author,
//         bookCover,
//         title
//       FROM uploadBook 
//       WHERE mainCategory = ? LIMIT 5`,
//       [category]
//     );

//     if (!rows || rows.length === 0) return [];

//     return rows.map(b => ({
//       title: b.title || "Unknown Title",
//       bookId: b.bookQid,
//       cover: b.bookCover,
//       author: Array.isArray(b.author) ? b.author.join(", ") : b.author || "Unknown",
//       source: "Otthor"
//     }));
//   } catch {
//     return [];
//   }
// }

// // Helper: OpenLibrary books
// async function getOpenLibraryBooks(category) {
//   try {
//     const url = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=5`;
//     const data = await fetchJson(url);
    
//     if (!data?.works) return [];
    
//     return data.works.map(w => ({
//       title: w.title || "Unknown Title",
//       bookId: w.key?.replace("/works/", "") || w.key,
//       cover: w.cover_id 
//         ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
//         : (w.cover_edition_key 
//             ? `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`
//             : null),
//       author: w.authors?.[0]?.name || "Unknown",
//       source: "Open Library"
//     }));
//   } catch {
//     return [];
//   }
// }


// async function getGutenbergBooks(category) {
//   try {
//     const url = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&page=1`;
//     const data = await fetchJson(url);
    
//     if (!data?.results) return [];
    
//     return data.results.slice(0, 5).map(b => ({
//       title: b.title || "Unknown Title",
//       bookId: b.id?.toString() || '',
//       cover: b.formats?.["image/jpeg"] || null,
//       author: b.authors?.[0]?.name || "Unknown",
//       source: "Project Gutenberg"
//     }));
//   } catch {
//     return [];
//   }
// }


// function getCoverUrl(originalUrl, mangaId) {
//   if (!originalUrl) return null;
//   return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
// }

// async function getMangaDexBooks(category) {
//   try {
//     const url = `https://api.mangadex.org/manga?limit=5&title=${encodeURIComponent(category)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
//     const data = await fetchJson(url);
//      if (!data.data || data.data.length === 0) {
//       console.log(`❌ No manga found for: "${query}"`);
//       return [];
//     }
//     console.log(`✅ Found ${data.data.length} manga`);
    
//     return data.data.map(manga => {
//       let coverUrl = null;
//     if (manga.relationships) {
//       const coverRel = manga.relationships.find(r => r.type === 'cover_art');
//       if (coverRel?.attributes?.fileName) {
//         coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
//       }
//     }
      
//       // Get authors
//       let author = "Various Manga Authors";
//       if (manga.relationships) {
//         const authorRels = manga.relationships.filter(r => r.type === 'author');
//         if (authorRels.length > 0) {
//           const authors = authorRels.map(r => r.attributes?.name).filter(name => name);
//           author = authors.join(", ") || author;
//         }
//       }
      
//       const title = manga.attributes?.title?.en || 
//                    manga.attributes?.title?.['ja-ro'] || 
//                    Object.values(manga.attributes?.title || {})[0] || 
//                    'Unknown Title';
      
//       return {
//         title: title,
//         bookId: manga.id,
//         cover: getCoverUrl(coverUrl, manga.id), // ← Use proxy here
//         author: author,
//         source: "MangaDex"
//       };
//     });
//   } catch {
//     return [];
//   }
// }

// async function getInternetArchiveBooks(category) {
//   try {
//     const url = `https://archive.org/advancedsearch.php?q=subject:${encodeURIComponent(category)}+AND+mediatype:texts&output=json&rows=5&sort[]=downloads+desc&fl[]=identifier,title,creator,subject`;
//     const data = await fetchJson(url);
    
//     if (!data?.response?.docs) return [];
    
//     return data.response.docs.map(doc => ({
//       title: doc.title || "Unknown Title",
//       bookId: doc.identifier || '',
//       cover: `https://archive.org/services/img/${doc.identifier}`,
//       author: doc.creator?.[0] || doc.creator || "Unknown",
//       source: "Internet Archive",
//     }));
//   } catch {
//     return [];
//   }
// }

// module.exports = { getSimilarBooks };

const { fetchJson } = require("../../../util/apiClient");
const db = require("../../../config/db");

// Cache for similar books (category-based)
const similarBooksCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of similarBooksCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      similarBooksCache.delete(key);
    }
  }
}, 60 * 1000);

// Controller: Get similar books from 5 sources
async function getSimilarBooks(req, res) {
  const category = req.params.category.toLowerCase().trim();
  
  if (!category) return res.status(400).json({ error: "Category is required" });

  try {
    // CHECK CACHE FIRST
    if (similarBooksCache.has(category)) {
      const cached = similarBooksCache.get(category);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Similar books cache hit: "${category}"`);
        return res.json(cached.data);
      }
    }

    console.log(`🌐 Fetching similar books for: "${category}"`);
    
    // Set individual timeouts for each source
    const timeout = 8000; // 8 seconds per source
    
    // Fetch all sources in parallel with timeouts
    const [otthorBooks, olBooks, gutenBooks, mangaDexBooks, archiveBooks] = await Promise.allSettled([
      withTimeout(getOtthorBooks(category), timeout),
      withTimeout(getOpenLibraryBooks(category), timeout),
      withTimeout(getGutenbergBooks(category), timeout),
      withTimeout(getMangaDexBooks(category), timeout),
      withTimeout(getInternetArchiveBooks(category), timeout)
    ]);

    // Combine results
    const similarBooks = [
      ...extractResults(otthorBooks),
      ...extractResults(olBooks),
      ...extractResults(gutenBooks),
      ...extractResults(mangaDexBooks),
      ...extractResults(archiveBooks)
    ];

    // Fisher-Yates shuffle and limit
    const shuffled = shuffleArray(similarBooks).slice(0, 20);

    const response = { 
      category, 
      results: shuffled,
      sourcesFound: {
        otthor: extractResults(otthorBooks).length,
        openlibrary: extractResults(olBooks).length,
        gutenberg: extractResults(gutenBooks).length,
        mangadex: extractResults(mangaDexBooks).length,
        internetarchive: extractResults(archiveBooks).length
      },
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    similarBooksCache.set(category, {
      data: response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (similarBooksCache.size > 100) {
      const firstKey = similarBooksCache.keys().next().value;
      similarBooksCache.delete(firstKey);
    }

    console.log(`✅ Similar books fetched and cached: "${category}" (${shuffled.length} books, cache size: ${similarBooksCache.size})`);
    res.json(response);
    
  } catch (err) {
    console.error("Similar books error:", err.message);
    
    // Try to serve from cache even if stale
    if (similarBooksCache.has(category)) {
      console.log(`🔄 Serving stale cache for: "${category}"`);
      const cached = similarBooksCache.get(category);
      cached.data._stale = true;
      return res.json(cached.data);
    }
    
    res.status(500).json({ error: "Failed to fetch similar books" });
  }
}

// Helper: Timeout wrapper
async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Source timeout')), ms)
    )
  ]);
}

// Helper: Extract results from Promise.allSettled
function extractResults(promiseResult) {
  return promiseResult.status === 'fulfilled' ? promiseResult.value : [];
}

// Helper: Fisher-Yates shuffle
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper: Otthor Books with connection pooling optimization
async function getOtthorBooks(category){
  try {
    const [rows] = await db.query(
      `SELECT 
        bookQid,
        author,
        bookCover,
        title,
        viewCount
      FROM uploadBook 
      WHERE mainCategory = ? 
      ORDER BY viewCount DESC
      LIMIT 5`,
      [category]
    );

    if (!rows || rows.length === 0) return [];

    return rows.map(b => ({
      title: b.title || "Unknown Title",
      bookId: b.bookQid,
      cover: b.bookCover,
      author: Array.isArray(b.author) ? b.author.join(", ") : b.author || "Unknown",
      source: "Otthor"
    }));
  } catch (err) {
    console.error(`Otthor query error for "${category}":`, err.message);
    return [];
  }
}

// Helper: OpenLibrary books with cache
const openLibraryCache = new Map();
async function getOpenLibraryBooks(category) {
  try {
    const cacheKey = `ol:${category}`;
    if (openLibraryCache.has(cacheKey)) {
      return openLibraryCache.get(cacheKey);
    }
    
    const url = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=5`;
    const data = await fetchJson(url);
    
    if (!data?.works) {
      openLibraryCache.set(cacheKey, []);
      return [];
    }
    
    const books = data.works.map(w => ({
      title: w.title || "Unknown Title",
      bookId: w.key?.replace("/works/", "") || w.key,
      cover: w.cover_id 
        ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
        : (w.cover_edition_key 
            ? `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`
            : null),
      author: w.authors?.[0]?.name || "Unknown",
      source: "Open Library"
    }));
    
    openLibraryCache.set(cacheKey, books);
    setTimeout(() => openLibraryCache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache
    return books;
  } catch (err) {
    console.error(`OpenLibrary error for "${category}":`, err.message);
    return [];
  }
}

// Helper: Gutenberg books with cache
const gutenbergCache = new Map();
async function getGutenbergBooks(category) {
  try {
    const cacheKey = `gutenberg:${category}`;
    if (gutenbergCache.has(cacheKey)) {
      return gutenbergCache.get(cacheKey);
    }
    
    const url = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&page=1`;
    const data = await fetchJson(url);
    
    if (!data?.results) {
      gutenbergCache.set(cacheKey, []);
      return [];
    }
    
    const books = data.results.slice(0, 5).map(b => ({
      title: b.title || "Unknown Title",
      bookId: b.id?.toString() || '',
      cover: b.formats?.["image/jpeg"] || null,
      author: b.authors?.[0]?.name || "Unknown",
      source: "Project Gutenberg"
    }));
    
    gutenbergCache.set(cacheKey, books);
    setTimeout(() => gutenbergCache.delete(cacheKey), 10 * 60 * 1000); // 10 min cache
    return books;
  } catch (err) {
    console.error(`Gutenberg error for "${category}":`, err.message);
    return [];
  }
}

// Helper: MangaDex books with cache
const mangaDexCache = new Map();
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) return null;
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function getMangaDexBooks(category) {
  try {
    const cacheKey = `mangadex:${category}`;
    if (mangaDexCache.has(cacheKey)) {
      return mangaDexCache.get(cacheKey);
    }
    
    const url = `https://api.mangadex.org/manga?limit=5&title=${encodeURIComponent(category)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    const data = await fetchJson(url);
    
    if (!data?.data || data.data.length === 0) {
      mangaDexCache.set(cacheKey, []);
      return [];
    }
    
    const books = data.data.map(manga => {
      let coverUrl = null;
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
        }
      }
      
      let author = "Various Manga Authors";
      if (manga.relationships) {
        const authorRels = manga.relationships.filter(r => r.type === 'author');
        if (authorRels.length > 0) {
          const authors = authorRels.map(r => r.attributes?.name).filter(name => name);
          author = authors.join(", ") || author;
        }
      }
      
      const title = manga.attributes?.title?.en || 
                   manga.attributes?.title?.['ja-ro'] || 
                   Object.values(manga.attributes?.title || {})[0] || 
                   'Unknown Title';
      
      return {
        title: title,
        bookId: manga.id,
        cover: getCoverUrl(coverUrl, manga.id),
        author: author,
        source: "MangaDex"
      };
    });
    
    mangaDexCache.set(cacheKey, books);
    setTimeout(() => mangaDexCache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache
    return books;
  } catch (err) {
    console.error(`MangaDex error for "${category}":`, err.message);
    return [];
  }
}

// Helper: Internet Archive books with cache
const archiveCache = new Map();
async function getInternetArchiveBooks(category) {
  try {
    const cacheKey = `archive:${category}`;
    if (archiveCache.has(cacheKey)) {
      return archiveCache.get(cacheKey);
    }
    
    const url = `https://archive.org/advancedsearch.php?q=subject:${encodeURIComponent(category)}+AND+mediatype:texts&output=json&rows=5&sort[]=downloads+desc&fl[]=identifier,title,creator,subject`;
    const data = await fetchJson(url);
    
    if (!data?.response?.docs) {
      archiveCache.set(cacheKey, []);
      return [];
    }
    
    const books = data.response.docs.map(doc => ({
      title: doc.title || "Unknown Title",
      bookId: doc.identifier || '',
      cover: `https://archive.org/services/img/${doc.identifier}`,
      author: doc.creator?.[0] || doc.creator || "Unknown",
      source: "Internet Archive",
    }));
    
    archiveCache.set(cacheKey, books);
    setTimeout(() => archiveCache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache
    return books;
  } catch (err) {
    console.error(`Internet Archive error for "${category}":`, err.message);
    return [];
  }
}

module.exports = { 
  getSimilarBooks
};