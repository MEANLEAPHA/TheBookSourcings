// const { fetchJson } = require("../../../util/apiClient");


// // Controller: Get similar books from 3 sources
// async function getSimilarBooks (req, res){
//  // Instead of req.query
// const category = req.params.category; // from /similar/:category




//   if (!category) return res.status(400).json({ error: "Category is required" });

//   let similarBooks = [];

//   try {
//     // --- OpenLibrary by subject ---
//     const olUrl = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=5`;
//     const olSimilar = await fetchJson(olUrl);

//     if (olSimilar?.works) {
//       similarBooks.push(
//         ...olSimilar.works.map((w) => {
//           let cover = null;
//           if (w.cover_id) {
//             cover = `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`;
//           } else if (w.cover_edition_key) {
//             cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
//           }

//           return {
//             title: w.title,
//             bookId: w.key.replace("/works/", ""),
//             cover,
//             author: w.authors?.[0]?.name || "Unknown",
//             source: "Open Library",
//           };
//         })
//       );
//     }


//     // --- Google Books by subject ---
//     const gUrl = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(category)}&maxResults=5&key=AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY`;
//     const gSimilar = await fetchJson(gUrl);

//     if (gSimilar?.items) {
//       similarBooks.push(
//         ...gSimilar.items.map((item) => ({
//           title: item.volumeInfo?.title || "No title",
//           bookId: item.id,
//           cover: item.volumeInfo?.imageLinks?.thumbnail.replace(/^http:/, 'https:') || null,
//           author: item.volumeInfo?.authors?.[0] || "Unknown",
//           source: "Google Books",
//         }))
//       );
//     }

//     // --- Project Gutenberg by topic ---
//     const gutUrl = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&page=1`;
//     const gutSimilar = await fetchJson(gutUrl);

//     if (gutSimilar?.results) {
//       similarBooks.push(
//         ...gutSimilar.results.slice(0, 5).map((b) => ({
//           title: b.title,
//           bookId: b.id,
//           cover: b.formats?.["image/jpeg"] || null,
//           author: b.authors?.[0]?.name || "Unknown",
//           source: "Project Gutenberg",
//         }))
//       );
//     }

//     res.json({ category, results: similarBooks });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// module.exports = { getSimilarBooks };


const { fetchJson } = require("../../../util/apiClient");
const db = require("../../../config/db");

// Controller: Get similar books from 5 sources
async function getSimilarBooks(req, res) {
  const category = req.params.category;
  
  if (!category) return res.status(400).json({ error: "Category is required" });

  try {
    // Fetch all sources in parallel for better performance
    const [otthorBooks, olBooks, gutenBooks, mangaDexBooks, archiveBooks] = await Promise.allSettled([
      getOtthorBooks(category),
      getOpenLibraryBooks(category),
      getGutenbergBooks(category),
      getMangaDexBooks(category),
      getInternetArchiveBooks(category)
    ]);

    // Combine results
    const similarBooks = [
      ...(otthorBooks.status === 'fulfilled' ? otthorBooks.value : []),
      ...(olBooks.status === 'fulfilled' ? olBooks.value : []),
      ...(gutenBooks.status === 'fulfilled' ? gutenBooks.value : []),
      ...(mangaDexBooks.status === 'fulfilled' ? mangaDexBooks.value : []),
      ...(archiveBooks.status === 'fulfilled' ? archiveBooks.value : [])
    ];

    // Shuffle and limit to reasonable number
    const shuffled = similarBooks.sort(() => Math.random() - 0.5).slice(0, 20);

    res.json({ 
      category, 
      results: shuffled,
      sourcesFound: {
        otthor: otthorBooks.status === 'fulfilled' ? otthorBooks.value.length : 0,
        openlibrary: olBooks.status === 'fulfilled' ? olBooks.value.length : 0,
        gutenberg: gutenBooks.status === 'fulfilled' ? gutenBooks.value.length : 0,
        mangadex: mangaDexBooks.status === 'fulfilled' ? mangaDexBooks.value.length : 0,
        internetarchive: archiveBooks.status === 'fulfilled' ? archiveBooks.value.length : 0
      }
    });
  } catch (err) {
    console.error("Similar books error:", err.message);
    res.status(500).json({ error: "Failed to fetch similar books" });
  }
}

// Helper: Otthor Books 
async function getOtthorBooks(category){
  try {
    const [rows] = await db.query(
      `SELECT 
        bookQid,
        author,
        bookCover,
        title
      FROM uploadBook 
      WHERE mainCategory = ? LIMIT 5`,
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
  } catch {
    return [];
  }
}

// Helper: OpenLibrary books
async function getOpenLibraryBooks(category) {
  try {
    const url = `https://openlibrary.org/subjects/${encodeURIComponent(category.toLowerCase())}.json?limit=5`;
    const data = await fetchJson(url);
    
    if (!data?.works) return [];
    
    return data.works.map(w => ({
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
  } catch {
    return [];
  }
}

// Helper: Gutenberg books
async function getGutenbergBooks(category) {
  try {
    const url = `https://gutendex.com/books?topic=${encodeURIComponent(category)}&page=1`;
    const data = await fetchJson(url);
    
    if (!data?.results) return [];
    
    return data.results.slice(0, 5).map(b => ({
      title: b.title || "Unknown Title",
      bookId: b.id?.toString() || '',
      cover: b.formats?.["image/jpeg"] || null,
      author: b.authors?.[0]?.name || "Unknown",
      source: "Project Gutenberg"
    }));
  } catch {
    return [];
  }
}

// Helper: MangaDex books with author fetching
// Add this at the top
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) return null;
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function getMangaDexBooks(category) {
  try {
    const url = `https://api.mangadex.org/manga?limit=5&title=${encodeURIComponent(category)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    const data = await fetchJson(url);
     if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found for: "${query}"`);
      return [];
    }
    console.log(`✅ Found ${data.data.length} manga`);
    
    return data.data.map(manga => {
      let coverUrl = null;
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
      }
    }
      
      // Get authors
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
        cover: getCoverUrl(coverUrl, manga.id), // ← Use proxy here
        author: author,
        source: "MangaDex"
      };
    });
  } catch {
    return [];
  }
}
// async function getMangaDexBooks(category) {
//   try {
//     // MangaDex doesn't have direct genre search, use title search
//     const url = `https://api.mangadex.org/manga?limit=5&title=${encodeURIComponent(category)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
//     const data = await fetchJson(url);
    
//     if (!data?.data) return [];
    
//     return data.data.map(manga => {
//       // Get cover
//       let cover = null;
//       if (manga.relationships) {
//         const coverRel = manga.relationships.find(r => r.type === 'cover_art');
//         if (coverRel?.attributes?.fileName) {
//           cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
//         }
//       }
      
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
//         cover: cover,
//         author: author,
//         source: "MangaDex"
//       };
//     });
//   } catch {
//     return [];
//   }
// }

// Helper: Internet Archive books
async function getInternetArchiveBooks(category) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=subject:${encodeURIComponent(category)}+AND+mediatype:texts&output=json&rows=5&sort[]=downloads+desc&fl[]=identifier,title,creator,subject`;
    const data = await fetchJson(url);
    
    if (!data?.response?.docs) return [];
    
    return data.response.docs.map(doc => ({
      title: doc.title || "Unknown Title",
      bookId: doc.identifier || '',
      cover: `https://archive.org/services/img/${doc.identifier}`,
      author: doc.creator?.[0] || doc.creator || "Unknown",
      source: "Internet Archive",
    }));
  } catch {
    return [];
  }
}

module.exports = { getSimilarBooks };