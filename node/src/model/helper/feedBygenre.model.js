// const db = require('../../config/db');

// const { searchOtthorByGenre } = require('../../controller/book/trending/filter/otthorFilter');
// const {searchGoogleBookByGenre} = require('../../controller/book/trending/filter/googleFilter');
// const {searchGutenbergByGenre} = require('../../controller/book/trending/filter/gutenbergFilter');
// const {searchOpenLibraryByGenre} = require('../../controller/book/trending/filter/openlibraryFilter');
// const {searchInternetArchiveByGenre} = require('../../controller/book/trending/filter/internetArchFilter');

// async function buildGenreFeed(genreSlug) {
//   // 1️⃣ resolve genre_id + name
//   const [[genre]] = await db.query(
//     `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
//     [genreSlug]
//   );

//   if (!genre) return [];

//   const genreName = genre.name;

//   // 2️⃣ fetch all sources
//   const results = await Promise.allSettled([
//     searchGoogleBookByGenre(genreName),
//     searchGutenbergByGenre(genreName),
//     searchOpenLibraryByGenre(genreName),
//     searchInternetArchiveByGenre(genreName),
//     searchOtthorByGenre(genreName)
//   ]);

//   return results
//     .filter(r => r.status === 'fulfilled')
//     .flatMap(r => r.value);
// }

// module.exports = { buildGenreFeed };
const db = require('../../config/db');

const { searchOtthorByGenre } = require('../../controller/book/trending/filter/otthorFilter');
// const { searchGoogleBookByGenre } = require('../../controller/book/trending/filter/googleFilter');
const { searchGutenbergByGenre } = require('../../controller/book/trending/filter/gutenbergFilter');
const { searchOpenLibraryByGenre } = require('../../controller/book/trending/filter/openlibraryFilter');
const { searchInternetArchiveByGenre } = require('../../controller/book/trending/filter/internetArchFilter');
const {searchByMangaDexGenre} = require('../../controller/book/trending/filter/mangaDexFilter');
// const { searchByAniListGenre } = require('../../controller/book/trending/filter/aniListFilter');

// Helper function to deduplicate books
function deduplicateBooks(books) {
  const seen = new Set();
  const uniqueBooks = [];
  
  for (const book of books) {
    if (!book || !book.title) continue;
    
    // Create a unique key from title and first author
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

async function buildGenreFeed(genreSlug, limit = 100) {
  try {
    const [[genre]] = await db.query(
      `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
      [genreSlug]
    );

    if (!genre) return [];

    const genreName = genre.name;
    const genreId = genre.genre_id;

    // Start all API calls immediately
    const apiPromises = [
      searchGutenbergByGenre(genreName, Math.ceil(limit/3)),
      searchOpenLibraryByGenre(genreName, Math.ceil(limit/3)),
      searchInternetArchiveByGenre(genreName, Math.ceil(limit/3)),
      searchOtthorByGenre(genreName, Math.ceil(limit/3)),
      searchByMangaDexGenre(genreName, Math.ceil(limit/3))
    ].map((promise, index) => 
      promise.catch(error => {
        const apiNames = ['Gutenberg', 'Open Library', 'Internet Archive', 'OTTHOR', 'MangaDex'];
        console.log(`⚠️ ${apiNames[index]} error: ${error.message}`);
        return []; // Return empty array on error - doesn't break other APIs
      })
    );

    // Wait for ALL APIs but with individual error handling
    const results = await Promise.allSettled(apiPromises);

    // Process results
    const combinedResults = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(book => book && book.title && book.bookId)
      .map(book => ({
        ...book,
        genre: book.genre || genreName,
        genreId: genreId,
        genreSlug: genreSlug
      }));

    const uniqueResults = deduplicateBooks(combinedResults);
    
    console.log(`📊 Genre "${genreName}": ${uniqueResults.length} books`);
    
    return uniqueResults.slice(0, limit);

  } catch (error) {
    console.error('🔥 Error in buildGenreFeed:', error.message);
    return [];
  }
}
// async function buildGenreFeed(genreSlug, limit = 100) {
//   try {
//     console.log(`🎭 Building genre feed for genre slug: ${genreSlug}`);
    
//     // 1️⃣ resolve genre_id + name
//     const [[genre]] = await db.query(
//       `SELECT genre_id, name FROM genres WHERE slug = ? LIMIT 1`,
//       [genreSlug]
//     );

//     if (!genre) {
//       console.log(`❌ Genre not found for slug: ${genreSlug}`);
//       return [];
//     }

//     const genreName = genre.name;
//     const genreId = genre.genre_id;
    
//     console.log(`🔍 Found genre: ${genreName} (ID: ${genreId})`);

//     // 2️⃣ fetch all sources with limit distribution
//     const results = await Promise.allSettled([
//       searchGutenbergByGenre(genreName, Math.ceil(limit/5)),
//       searchOpenLibraryByGenre(genreName, Math.ceil(limit/5)),
//       searchInternetArchiveByGenre(genreName, Math.ceil(limit/5)),
//       searchOtthorByGenre(genreName, Math.ceil(limit/5)),
//       searchByMangaDexGenre(genreName, Math.ceil(limit/5))
//     ]);

//     // 3️⃣ Log results for debugging
//     const apiNames = ['Gutenberg', 'Open Library', 'Internet Archive', 'OTTHOR', 'MangaDex'];
//     results.forEach((result, index) => {
//       if (result.status === 'fulfilled') {
//         console.log(`✅ ${apiNames[index]}: Found ${result.value.length} books`);
//       } else {
//         console.log(`❌ ${apiNames[index]}: ${result.reason?.message || 'Error'}`);
//       }
//     });

//     // 4️⃣ Combine and filter results
//     const combinedResults = results
//       .filter(r => r.status === 'fulfilled')
//       .flatMap(r => r.value)
//       .filter(book => book && book.title && book.bookId)
//       .map(book => ({
//         ...book,
//         // Add genre information to each book
//         genre: book.genre || genreName,
//         genreId: genreId,
//         genreSlug: genreSlug
//       }));

//     // 5️⃣ Deduplicate books
//     const uniqueResults = deduplicateBooks(combinedResults);
    
//     console.log(`📊 Total unique results: ${uniqueResults.length}`);

//     // 6️⃣ Return limited results
//     return uniqueResults.slice(0, limit);

//   } catch (error) {
//     console.error('🔥 Error in buildGenreFeed:', error.message);
//     return [];
//   }
// }

module.exports = { buildGenreFeed };