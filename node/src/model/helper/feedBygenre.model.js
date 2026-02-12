
// const db = require('../../config/db');

// const { searchOtthorByGenre } = require('../../controller/book/trending/filter/otthorFilter');
// // const { searchGoogleBookByGenre } = require('../../controller/book/trending/filter/googleFilter');
// const { searchGutenbergByGenre } = require('../../controller/book/trending/filter/gutenbergFilter');
// const { searchOpenLibraryByGenre } = require('../../controller/book/trending/filter/openlibraryFilter');
// const { searchInternetArchiveByGenre } = require('../../controller/book/trending/filter/internetArchFilter');
// const {searchByMangaDexGenre} = require('../../controller/book/trending/filter/mangaDexFilter');
// // const { searchByAniListGenre } = require('../../controller/book/trending/filter/aniListFilter');

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

// async function buildGenreFeed(genreSlug, limit = 100) {
//   try {
//     const [[genre]] = await db.query(
//       `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
//       [genreSlug]
//     );

//     if (!genre) return [];

//     const genreName = genre.name;
//     const genreId = genre.genre_id;

//     // Start all API calls immediately
//     const apiPromises = [
//       searchGutenbergByGenre(genreName, Math.ceil(limit/3)),
//       searchOpenLibraryByGenre(genreName, Math.ceil(limit/3)),
//       searchInternetArchiveByGenre(genreName, Math.ceil(limit/3)),
//       searchOtthorByGenre(genreName, Math.ceil(limit/3)),
//       searchByMangaDexGenre(genreName, Math.ceil(limit/3))
//     ].map((promise, index) => 
//       promise.catch(error => {
//         const apiNames = ['Gutenberg', 'Open Library', 'Internet Archive', 'OTTHOR', 'MangaDex'];
//         console.log(`⚠️ ${apiNames[index]} error: ${error.message}`);
//         return []; // Return empty array on error - doesn't break other APIs
//       })
//     );

//     // Wait for ALL APIs but with individual error handling
//     const results = await Promise.allSettled(apiPromises);

//     // Process results
//     const combinedResults = results
//       .filter(r => r.status === 'fulfilled')
//       .flatMap(r => r.value)
//       .filter(book => book && book.title && book.bookId)
//       .map(book => ({
//         ...book,
//         genre: book.genre || genreName,
//         genreId: genreId,
//         genreSlug: genreSlug
//       }));

//     const uniqueResults = deduplicateBooks(combinedResults);
    
//     console.log(`📊 Genre "${genreName}": ${uniqueResults.length} books`);
    
//     return uniqueResults.slice(0, limit);

//   } catch (error) {
//     console.error('🔥 Error in buildGenreFeed:', error.message);
//     return [];
//   }
// }
// module.exports = { buildGenreFeed };


// model/helper/feedBygenre.model.js
const db = require('../../config/db');
const { unifiedSearch } = require('../../controller/book/trending/filter/unifiedSearch');
const { deduplicateBooks } = require('../../util/deduplicate');

async function buildGenreFeed(genreSlug, limit = 100) {
  try {
    const [[genre]] = await db.query(
      `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
      [genreSlug]
    );
    if (!genre) return [];

    const genreName = genre.name;
    const perApiLimit = Math.max(5, Math.ceil(limit / 4)); // Distribute load
    
    // Single unified search call - parallelized internally
    const books = await unifiedSearch({
      query: genreName,
      type: 'genre',
      limit: perApiLimit,
      apis: ['gutenberg', 'openlibrary', 'internetarchive', 'mangadex', 'otthor']
    });

    // Add genre metadata
    const enriched = books.map(book => ({
      ...book,
      genreId: genre.genre_id,
      genreSlug
    }));

    const unique = deduplicateBooks(enriched);
    console.log(`📊 Genre "${genreName}": ${unique.length} books`);
    
    return unique.slice(0, limit);
  } catch (error) {
    console.error('🔥 Error in buildGenreFeed:', error.message);
    return [];
  }
}

module.exports = { buildGenreFeed };