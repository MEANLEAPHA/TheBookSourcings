const db = require('../../config/db');
const { searchOtthorByAuthor } = require('../../controller/book/trending/filter/otthorFilter');
const {searchGoogleBookByAuthor} = require('../../controller/book/trending/filter/googleFilter');
const {searchGutenbergByAuthor} = require('../../controller/book/trending/filter/gutenbergFilter');
const {searchOpenLibraryByAuthor} = require('../../controller/book/trending/filter/openlibraryFilter');

async function buildAuthorFeed(authorId, limit) {
  let authorName = null;

  console.log(`Building author feed for authorId: ${authorId}`);

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
    console.log(`Found author name: ${authorName}`);
    
    if (!authorName) return [];

    // URL encode the author name for API calls
    const encodedAuthorName = encodeURIComponent(authorName);
    
    try {
      const results = await Promise.allSettled([
        searchGoogleBookByAuthor(encodedAuthorName, limit),
        searchGutenbergByAuthor(encodedAuthorName, limit),
        searchOpenLibraryByAuthor(encodedAuthorName, limit)
      ]);

      // Log each result for debugging
      results.forEach((result, index) => {
        const apiNames = ['Google Books', 'Gutenberg', 'Open Library'];
        if (result.status === 'fulfilled') {
          console.log(`${apiNames[index]}: Found ${result.value.length} results`);
        } else {
          console.log(`${apiNames[index]}: Error - ${result.reason.message}`);
        }
      });

      // Combine successful results
      const combinedResults = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);
      
      console.log(`Total combined results: ${combinedResults.length}`);
      return combinedResults.slice(0, limit);
      
    } catch (err) {
      console.error('Error in buildAuthorFeed:', err);
      return [];
    }
  }
}
// async function buildAuthorFeed(authorId, limit) {
//   let authorName = null;

//   console.log(`Building author feed for authorId: ${authorId}`); // Debug log

//   // 🔹 OTT author (internal source only)
//   if (authorId.startsWith('OTTM')) {
//     if (!authorId) return [];
//     return await searchOtthorByAuthor(authorId); // return directly
//   } 
//   // 🔹 External author (mixed sources)
//   else {
//     // FIXED: Check for OTT_ prefix (not OTTM)
//     if (authorId.startsWith('OTT_')) {
//       // This is likely an external author reference
//       const [[row]] = await db.query(
//         `SELECT name FROM authors WHERE author_id = ? LIMIT 1`,
//         [authorId]
//       );

//       authorName = row?.name;
//       console.log(`Found author name: ${authorName}`); // Debug log
      
//       if (!authorName) return [];

//       const results = await Promise.allSettled([
//         searchGoogleBookByAuthor(authorName, limit),
//         searchGutenbergByAuthor(authorName, limit),
//         searchOpenLibraryByAuthor(authorName, limit)
//       ]);

//       // Combine and deduplicate results
//       const combinedResults = results
//         .filter(r => r.status === 'fulfilled')
//         .flatMap(r => r.value);
      
//       return combinedResults.slice(0, limit);
//     } else {
//       // Handle other author ID formats
//       console.log(`Unknown author ID format: ${authorId}`);
//       return [];
//     }
//   }
// }
module.exports = { buildAuthorFeed };
