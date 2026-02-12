
// const db = require('../../config/db');
// const { searchOtthorByAuthor } = require('../../controller/book/trending/filter/otthorFilter');
// // const {searchGoogleBookByAuthor} = require('../../controller/book/trending/filter/googleFilter');
// const {searchGutenbergByAuthor} = require('../../controller/book/trending/filter/gutenbergFilter');
// const {searchOpenLibraryByAuthor} = require('../../controller/book/trending/filter/openlibraryFilter');
// const {searchInternetArchiveByAuthor} = require('../../controller/book/trending/filter/internetArchFilter');
// const {searchByMangaDexAuthor} = require('../../controller/book/trending/filter/mangaDexFilter');
// // const {searchByAniListAuthor} = require('../../controller/book/trending/filter/aniListFilter');

// // Helper: Promise with timeout
// function promiseWithTimeout(promise, timeoutMs, errorMessage = 'Timeout') {
//   return Promise.race([
//     promise,
//     new Promise((_, reject) => 
//       setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
//     )
//   ]);
// }

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
      
//       // Configure all API calls with individual timeouts (10 seconds each)
//       const apiConfigs = [
//         { name: 'Internet Archive', func: searchInternetArchiveByAuthor, timeout: 10000 },
//         { name: 'Gutenberg', func: searchGutenbergByAuthor, timeout: 10000 },
//         { name: 'Open Library', func: searchOpenLibraryByAuthor, timeout: 10000 },
//         { name: 'MangaDex', func: searchByMangaDexAuthor, timeout: 10000 }
//       ];

//       const results = await Promise.allSettled(
//         apiConfigs.map(async ({ name, func, timeout }) => {
//           try {
//             const result = await promiseWithTimeout(
//               func(authorName, Math.ceil(limit/4)),
//               timeout,
//               `${name} timeout after ${timeout}ms`
//             );
//             return { name, result, status: 'fulfilled' };
//           } catch (error) {
//             console.log(`⚠️ ${name} error for "${authorName}": ${error.message}`);
//             return { name, error: error.message, status: 'rejected' };
//           }
//         })
//       );

//       // Combine only successful results
//       const combinedResults = [];
      
//       results.forEach((item) => {
//         if (item.status === 'fulfilled' && item.value.status === 'fulfilled') {
//           console.log(`✅ ${item.value.name}: Found ${item.value.result.length} books`);
//           combinedResults.push(...item.value.result);
//         }
//       });

//       // Filter and deduplicate
//       const validBooks = combinedResults.filter(book => book && book.title);
//       const uniqueResults = deduplicateBooks(validBooks);
      
//       console.log(`📊 Total unique results: ${uniqueResults.length}`);
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

// module.exports = { buildAuthorFeed };
// model/helper/feedByauthor.model.js
const db = require('../../config/db');
const { unifiedSearch } = require('../../controller/book/trending/filter/unifiedSearch');
const { deduplicateBooks } = require('../../util/deduplicate');

async function buildAuthorFeed(authorId, limit = 100) {
  try {
    // Handle OTT author (internal)
    if (authorId.startsWith('OTTM')) {
      const { searchOtthor } = require('../../controller/book/trending/filter/unifiedSearch');
      const books = await searchOtthor({ query: authorId, type: 'author', limit });
      return books.slice(0, limit);
    }

    // External author - get name from DB
    const [[row]] = await db.query(
      `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
      [authorId]
    );
    
    const authorName = row?.name;
    if (!authorName) return [];

    const perApiLimit = Math.max(5, Math.ceil(limit / 4));
    
    // Single unified search call
    const books = await unifiedSearch({
      query: authorName,
      type: 'author',
      limit: perApiLimit,
      apis: ['gutenberg', 'openlibrary', 'internetarchive', 'mangadex']
    });

    const unique = deduplicateBooks(books);
    console.log(`📊 Author "${authorName}": ${unique.length} books`);
    
    return unique.slice(0, limit);
  } catch (error) {
    console.error('🔥 Error in buildAuthorFeed:', error.message);
    return [];
  }
}

module.exports = { buildAuthorFeed };