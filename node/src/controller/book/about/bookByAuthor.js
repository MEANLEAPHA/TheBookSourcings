// const { fetchJson } = require("../../../util/apiClient");
// const db = require("../../../config/db");
// // Controller: Get similar books from 3 sources
// async function bookByAuthor(req, res) {
//   const authorName = req.params.authorName;

//   if (!authorName) return res.status(400).json({ error: "authorName is required" });

//   let authorBooks = [];

//   try {
//     // --- OpenLibrary ---
//     const olUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName.toLowerCase())}&limit=3`;
//     const olSimilar = await fetchJson(olUrl);

//     if (olSimilar?.docs) {
//       authorBooks.push(
//         ...olSimilar.docs.slice(0, 3).map((w) => {
//           let cover = null;
//           if (w.cover_i) {
//             cover = `https://covers.openlibrary.org/b/id/${w.cover_i}-L.jpg`;
//           } else if (w.cover_edition_key) {
//             cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
//           }

//           return {
//             title: w.title,
//             bookId: w.key.replace("/works/", ""),
//             cover,
//             author: w.author_name?.join(", ") || null,
//             source: "Open Library",
//           };
//         })
//       );
//     }
//     const gutUrl = `https://gutendex.com/books?search=${encodeURIComponent(authorName)}`;
//     const gutSimilar = await fetchJson(gutUrl);

//     if (gutSimilar?.results) {
//        authorBooks.push(
//         ...gutSimilar.results.slice(0, 3).map((b) => ({
//           title: b.title,
//           bookId: b.id,
//           cover: b.formats?.["image/jpeg"] || null,
//           author: b.authors?.map((a) => a.name).join(", ") || null,
//           source: "Project Gutenberg",
//         }))
//       );
//     }

//     // Return all sources combined
//     res.json({
//       authorName,
//       results: authorBooks,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }
// async function bookByAuthorByQid(req, res) {
//   try {
//     const { authorQid } = req.params;
//     if (!authorQid) {
//       return res.status(400).json({ error: "Author QID required" });
//     }

//     const authorQids = authorQid.split(",");

//     // Build WHERE b.authorId LIKE '%QID%' OR '%QID2%'
//     const whereClauses = authorQids.map(() => `b.authorId LIKE ?`).join(" OR ");
//     const likeValues = authorQids.map(qid => `%${qid}%`);

//     const [rows] = await db.query(
//       `
//       SELECT 
//         b.bookQid, 
//         b.bookCover,
//         b.title, 
//         b.subTitle, 
//         b.author, 
//         u.authorQid,
//         u.username,
//         u.memberQid
//       FROM uploadBook b
//       LEFT JOIN users u 
//         ON u.authorQid IN (${authorQids.map(() => "?").join(",")})
//       WHERE ${whereClauses}
//       ORDER BY b.UploadAt DESC
//       `,
//       [...authorQids, ...likeValues]
//     );

//     return res.json({ authors: rows });
//   } catch (err) {
//     console.error("bookByAuthorByQid error:", err.message);
//     res.status(500).json({ error: "Failed to fetch books by author QID" });
//   }
// }






// module.exports = { bookByAuthor, bookByAuthorByQid };
const { fetchJson } = require("../../../util/apiClient");
const db = require("../../../config/db");

// Cache for author books
const authorCache = new Map();
const AUTHOR_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authorCache.entries()) {
    if (now - value.timestamp > AUTHOR_CACHE_DURATION) {
      authorCache.delete(key);
    }
  }
}, 60 * 1000);

async function bookByAuthor(req, res) {
  const authorName = req.params.authorName?.trim();
  
  if (!authorName) {
    return res.status(400).json({ error: "authorName is required" });
  }

  // Normalize cache key
  const cacheKey = `author:${authorName.toLowerCase()}`;
  
  // CHECK CACHE FIRST
  if (authorCache.has(cacheKey)) {
    const cached = authorCache.get(cacheKey);
    if (Date.now() - cached.timestamp < AUTHOR_CACHE_DURATION) {
      console.log(`📦 Author cache hit: "${authorName}"`);
      return res.json(cached.data);
    }
  }

  console.log(`🌐 Fetching books by author: "${authorName}"`);
  
  try {
    // Fetch all sources in parallel with timeouts
    const [olBooks, gutenBooks, archiveBooks, mangaDexBooks] = await Promise.allSettled([
      withTimeout(getOpenLibraryBooks(authorName), 5000),
      withTimeout(getGutenbergBooks(authorName), 5000),
      withTimeout(getInternetArchiveBooks(authorName), 5000),
      withTimeout(getMangaDexBooks(authorName), 5000)
    ]);

    // Combine results
    const authorBooks = [
      ...extractResults(olBooks),
      ...extractResults(gutenBooks),
      ...extractResults(archiveBooks),
      ...extractResults(mangaDexBooks)
    ];

    // Shuffle and limit
    const shuffled = shuffleArray(authorBooks).slice(0, 15);

    const response = {
      authorName,
      results: shuffled,
      sourcesFound: {
        openlibrary: extractResults(olBooks).length,
        gutenberg: extractResults(gutenBooks).length,
        internetarchive: extractResults(archiveBooks).length,
        mangadex: extractResults(mangaDexBooks).length
      },
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    authorCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (authorCache.size > 200) {
      const firstKey = authorCache.keys().next().value;
      authorCache.delete(firstKey);
    }

    console.log(`✅ Author books fetched and cached: "${authorName}" (${shuffled.length} books)`);
    res.json(response);
    
  } catch (err) {
    console.error("bookByAuthor error:", err.message);
    
    // Try to serve from cache even if stale
    if (authorCache.has(cacheKey)) {
      console.log(`🔄 Serving stale cache for author: "${authorName}"`);
      const cached = authorCache.get(cacheKey);
      cached.data._stale = true;
      return res.json(cached.data);
    }
    
    res.status(500).json({ error: "Failed to fetch author books" });
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

// OpenLibrary books
async function getOpenLibraryBooks(authorName) {
  try {
    const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName.toLowerCase())}&limit=5`;
    const data = await fetchJson(url);
    
    if (!data?.docs) return [];
    
    return data.docs.slice(0, 5).map(w => ({
      title: w.title || "Unknown Title",
      bookId: w.key?.replace("/works/", "") || w.key,
      cover: w.cover_i 
        ? `https://covers.openlibrary.org/b/id/${w.cover_i}-L.jpg`
        : (w.cover_edition_key 
            ? `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`
            : null),
      author: w.author_name?.join(", ") || authorName,
      source: "Open Library",
    }));
  } catch {
    return [];
  }
}

// Gutenberg books
async function getGutenbergBooks(authorName) {
  try {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(authorName)}`;
    const data = await fetchJson(url);
    
    if (!data?.results) return [];
    
    return data.results.slice(0, 5).map(b => ({
      title: b.title || "Unknown Title",
      bookId: b.id?.toString() || '',
      cover: b.formats?.["image/jpeg"] || null,
      author: b.authors?.map(a => a.name).join(", ") || authorName,
      source: "Project Gutenberg",
    }));
  } catch {
    return [];
  }
}

// Internet Archive books
async function getInternetArchiveBooks(authorName) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=creator:${encodeURIComponent(`"${authorName}"`)} AND mediatype:texts&output=json&rows=5&sort[]=downloads+desc&fl[]=identifier,title,creator`;
    const data = await fetchJson(url);
    
    if (!data?.response?.docs) return [];
    
    return data.response.docs.map(doc => ({
      title: doc.title || "Unknown Title",
      bookId: doc.identifier || '',
      cover: `https://archive.org/services/img/${doc.identifier}`,
      author: doc.creator?.[0] || doc.creator || authorName,
      source: "Internet Archive",
    }));
  } catch {
    return [];
  }
}

// MangaDex books (author search)
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) return null;
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function getMangaDexBooks(authorName) {
  try {
    // First search for author
    const authorUrl = `https://api.mangadex.org/author?limit=1&name=${encodeURIComponent(authorName)}`;
    const authorData = await fetchJson(authorUrl);
    
    if (!authorData?.data || authorData.data.length === 0) {
      return []; // No author found
    }
    
    const authorId = authorData.data[0].id;
    
    // Search manga by this author
    const mangaUrl = `https://api.mangadex.org/manga?limit=5&authors[]=${authorId}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art`;
    const mangaData = await fetchJson(mangaUrl);
    
    if (!mangaData?.data) return [];
    
    return mangaData.data.map(manga => {
      let coverUrl = null;
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
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
        author: authorName,
        source: "MangaDex",
      };
    });
  } catch {
    return [];
  }
}

// Keep the existing bookByAuthorByQid function (unchanged)
async function bookByAuthorByQid(req, res) {
  try {
    const { authorQid } = req.params;
    if (!authorQid) {
      return res.status(400).json({ error: "Author QID required" });
    }

    const authorQids = authorQid.split(",");

    // Build WHERE b.authorId LIKE '%QID%' OR '%QID2%'
    const whereClauses = authorQids.map(() => `b.authorId LIKE ?`).join(" OR ");
    const likeValues = authorQids.map(qid => `%${qid}%`);

    const [rows] = await db.query(
      `
      SELECT 
        b.bookQid, 
        b.bookCover,
        b.title, 
        b.subTitle, 
        b.author, 
        u.authorQid,
        u.username,
        u.memberQid
      FROM uploadBook b
      LEFT JOIN users u 
        ON u.authorQid IN (${authorQids.map(() => "?").join(",")})
      WHERE ${whereClauses}
      ORDER BY b.UploadAt DESC
      `,
      [...authorQids, ...likeValues]
    );

    return res.json({ authors: rows });
  } catch (err) {
    console.error("bookByAuthorByQid error:", err.message);
    res.status(500).json({ error: "Failed to fetch books by author QID" });
  }
}

// Optional cache stats endpoint
// function getAuthorCacheStats(req, res) {
//   res.json({
//     cacheSize: authorCache.size,
//     cacheDuration: `${AUTHOR_CACHE_DURATION / 60000} minutes`,
//     cacheKeys: Array.from(authorCache.keys()).slice(0, 10)
//   });
// }

module.exports = { 
  bookByAuthor, 
  bookByAuthorByQid
  // getAuthorCacheStats // Optional
};