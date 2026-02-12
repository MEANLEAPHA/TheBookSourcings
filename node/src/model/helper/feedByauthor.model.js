// const db = require('../../config/db');
// const { searchOtthorByAuthor } = require('../../controller/book/trending/filter/otthorFilter');
// // const {searchGoogleBookByAuthor} = require('../../controller/book/trending/filter/googleFilter');
// const {searchGutenbergByAuthor} = require('../../controller/book/trending/filter/gutenbergFilter');
// const {searchOpenLibraryByAuthor} = require('../../controller/book/trending/filter/openlibraryFilter');
// const {searchInternetArchiveByAuthor} = require('../../controller/book/trending/filter/internetArchFilter');
// const {searchByMangaDexAuthor} = require('../../controller/book/trending/filter/mangaDexFilter');
// // const {searchByAniListAuthor} = require('../../controller/book/trending/filter/aniListFilter');

// async function buildAuthorFeed(authorId, limit) {
//   try {
//     let authorName = null;

//     console.log(`📚 Building author feed for authorId: ${authorId}`);

//     // 🔹 OTT author (internal source only)
//     if (authorId.startsWith('OTTM')) {
//       if (!authorId) return [];
//       return await searchOtthorByAuthor(authorId, limit);
//     } 
//     // 🔹 External author (mixed sources)
//     else {
//       const [[row]] = await db.query(
//         `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
//         [authorId]
//       );

//       authorName = row?.name;
//       console.log(`👤 Found author name: "${authorName}"`);
      
//       if (!authorName) {
//         console.log('❌ No author name found');
//         return [];
//       }

//       console.log(`🔍 Searching for books by "${authorName}"...`);
      
//       // Use all 4 sources: Google Books, Internet Archive, Gutenberg, and Open Library
//       const results = await Promise.allSettled([
//         // searchGoogleBookByAuthor(authorName, Math.ceil(limit/4)),
//         searchInternetArchiveByAuthor(authorName, Math.ceil(limit/4)),
//         searchGutenbergByAuthor(authorName, Math.ceil(limit/4)),
//         searchOpenLibraryByAuthor(authorName, Math.ceil(limit/4)),
//         searchByMangaDexAuthor(authorName, Math.ceil(limit/4))
//       ]);

//       // Log results for debugging
//       const apiNames = ['Internet Archive', 'Gutenberg', 'Open Library', 'MangaDex'];
//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled') {
//           console.log(`✅ ${apiNames[index]}: Found ${result.value.length} books`);
//         } else {
//           console.log(`❌ ${apiNames[index]}: ${result.reason?.message || 'Error'}`);
//         }
//       });

//       // Combine successful results
//       const combinedResults = results
//         .filter(r => r.status === 'fulfilled')
//         .flatMap(r => r.value)
//         .filter(book => book && book.title); // Filter out invalid books

//       // Deduplicate by title
//       const uniqueResults = deduplicateBooks(combinedResults);
      
//       console.log(`📊 Total unique results from all sources: ${uniqueResults.length}`);
//       return uniqueResults.slice(0, limit);
//     }
//   } catch (error) {
//     console.error('🔥 Error in buildAuthorFeed:', error.message);
//     return [];
//   }
// }
// // Helper function to deduplicate books
// function deduplicateBooks(books) {
//   const seen = new Set();
//   const uniqueBooks = [];
  
//   for (const book of books) {
//     if (!book || !book.title) continue;
    
//     // Create a unique key from title and first author
//     const titleKey = book.title.toLowerCase().trim();
//     const firstAuthor = book.authors?.[0]?.toLowerCase().trim() || 'unknown';
//     const uniqueKey = `${titleKey}|${firstAuthor}`;
    
//     if (!seen.has(uniqueKey)) {
//       seen.add(uniqueKey);
//       uniqueBooks.push(book);
//     }
//   }
  
//   return uniqueBooks;
// }
// // async function buildAuthorFeed(authorId, limit) {
// //   let authorName = null;

// //   console.log(`Building author feed for authorId: ${authorId}`); // Debug log

// //   // 🔹 OTT author (internal source only)
// //   if (authorId.startsWith('OTTM')) {
// //     if (!authorId) return [];
// //     return await searchOtthorByAuthor(authorId); // return directly
// //   } 
// //   // 🔹 External author (mixed sources)
// //   else {
// //     // FIXED: Check for OTT_ prefix (not OTTM)
// //     if (authorId.startsWith('OTT_')) {
// //       // This is likely an external author reference
// //       const [[row]] = await db.query(
// //         `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
// //         [authorId]
// //       );

// //       authorName = row?.name;
// //       console.log(`Found author name: ${authorName}`); // Debug log
      
// //       if (!authorName) return [];

// //       const results = await Promise.allSettled([
// //         searchGoogleBookByAuthor(authorName, limit),
// //         searchGutenbergByAuthor(authorName, limit),
// //         searchOpenLibraryByAuthor(authorName, limit)
// //       ]);

// //       // Combine and deduplicate results
// //       const combinedResults = results
// //         .filter(r => r.status === 'fulfilled')
// //         .flatMap(r => r.value);
      
// //       return combinedResults.slice(0, limit);
// //     } else {
// //       // Handle other author ID formats
// //       console.log(`Unknown author ID format: ${authorId}`);
// //       return [];
// //     }
// //   }
// // }
// module.exports = { buildAuthorFeed };
const db = require('../../config/db');
const { searchOtthorByAuthor } = require('../../controller/book/trending/filter/otthorFilter');
// const {searchGoogleBookByAuthor} = require('../../controller/book/trending/filter/googleFilter');
const {searchGutenbergByAuthor} = require('../../controller/book/trending/filter/gutenbergFilter');
const {searchOpenLibraryByAuthor} = require('../../controller/book/trending/filter/openlibraryFilter');
const {searchInternetArchiveByAuthor} = require('../../controller/book/trending/filter/internetArchFilter');
const {searchByMangaDexAuthor} = require('../../controller/book/trending/filter/mangaDexFilter');
// const {searchByAniListAuthor} = require('../../controller/book/trending/filter/aniListFilter');

// Helper: Promise with timeout
function promiseWithTimeout(promise, timeoutMs, errorMessage = 'Timeout') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

async function buildAuthorFeed(authorId, limit) {
  try {
    let authorName = null;

    console.log(`📚 Building author feed for authorId: ${authorId}`);

    // 🔹 OTT author (internal source only)
    if (authorId.startsWith('OTTM')) {
      if (!authorId) return [];
      return await searchOtthorByAuthor(authorId, limit);
    } 
    // 🔹 External author (mixed sources)
    else {
      const [[row]] = await db.query(
        `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
        [authorId]
      );

      authorName = row?.name;
      console.log(`👤 Found author name: "${authorName}"`);
      
      if (!authorName) {
        console.log('❌ No author name found');
        return [];
      }

      console.log(`🔍 Searching for books by "${authorName}"...`);
      
      // Configure all API calls with individual timeouts (10 seconds each)
      const apiConfigs = [
        { name: 'Internet Archive', func: searchInternetArchiveByAuthor, timeout: 10000 },
        { name: 'Gutenberg', func: searchGutenbergByAuthor, timeout: 10000 },
        { name: 'Open Library', func: searchOpenLibraryByAuthor, timeout: 10000 },
        { name: 'MangaDex', func: searchByMangaDexAuthor, timeout: 10000 }
      ];

      const results = await Promise.allSettled(
        apiConfigs.map(async ({ name, func, timeout }) => {
          try {
            const result = await promiseWithTimeout(
              func(authorName, Math.ceil(limit/4)),
              timeout,
              `${name} timeout after ${timeout}ms`
            );
            return { name, result, status: 'fulfilled' };
          } catch (error) {
            console.log(`⚠️ ${name} error for "${authorName}": ${error.message}`);
            return { name, error: error.message, status: 'rejected' };
          }
        })
      );

      // Combine only successful results
      const combinedResults = [];
      
      results.forEach((item) => {
        if (item.status === 'fulfilled' && item.value.status === 'fulfilled') {
          console.log(`✅ ${item.value.name}: Found ${item.value.result.length} books`);
          combinedResults.push(...item.value.result);
        }
      });

      // Filter and deduplicate
      const validBooks = combinedResults.filter(book => book && book.title);
      const uniqueResults = deduplicateBooks(validBooks);
      
      console.log(`📊 Total unique results: ${uniqueResults.length}`);
      return uniqueResults.slice(0, limit);
    }
  } catch (error) {
    console.error('🔥 Error in buildAuthorFeed:', error.message);
    return [];
  }
}

// Helper function to deduplicate books
function deduplicateBooks(books) {
  const seen = new Set();
  const uniqueBooks = [];
  
  for (const book of books) {
    if (!book || !book.title) continue;
    
    const titleKey = book.title.toLowerCase().trim();
    const firstAuthor = book.authors?.[0]?.toLowerCase().trim() || 'unknown';
    const uniqueKey = `${titleKey}|${firstAuthor}`;
    
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueBooks.push(book);
    }
  }
  
  return uniqueBooks;
}

module.exports = { buildAuthorFeed };