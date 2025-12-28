// Import dependencies
const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');
const { getOtthorTrending } = require('./otthorController');

// Define the controller function
// async function getAllTrending(req, res) {
//   try {

//     const google = await getGoogleTrending().catch(err => {
//       console.error("Google Books fetch failed:", err.message || err);
//       return [];
//     });

//     const gutenberg = await getGutenbergTrending().catch(err => {
//       console.error("Gutenberg fetch failed:", err.message || err);
//       return [];
//     });

//     const openLibrary = await getOpenLibraryTrending().catch(err => {
//       console.error("OpenLibrary fetch failed:", err.message || err);
//       return [];
//     });
//     const otthor = await getOtthorTrending().catch(err => {
//       console.error("otthor fetch failed:", err.message || err);
//       return [];
//     })
//     res.json({
//       success: true,
//       data: {
//         google,
//         gutenberg,
//         openLibrary,
//         otthor
//       }
//     });
//   } catch (err) {
//     console.error("Unexpected error in getAllTrending:", err);
//     res.status(500).json({ success: false, message: "Error fetching trending books" });
//   }
// }
let trendingCache = {
  data: null,
  expiry: 0
};

function isCacheValid() {
  return trendingCache.data && Date.now() < trendingCache.expiry;
}

async function getAllTrending(req, res) {
  try {
    // ✅ 1. RETURN CACHE IF VALID
    if (isCacheValid()) {
      return res.json({
        success: true,
        data: trendingCache.data
      });
    }

    // ✅ 2. FETCH ALL SOURCES IN PARALLEL
    const [
      google,
      gutenberg,
      openLibrary,
      otthor
    ] = await Promise.all([
      getGoogleTrending().catch(() => []),
      getGutenbergTrending().catch(() => []),
      getOpenLibraryTrending().catch(() => []),
      getOtthorTrending().catch(() => [])
    ]);

    // ✅ 3. MIX & LIMIT
    const mixedBooks = mixBooks([
      ...otthor,
      ...google,
      ...gutenberg,
      ...openLibrary
    ]);

    // ✅ 4. SAVE TO CACHE
    trendingCache = {
      data: mixedBooks,
      expiry: Date.now() + 1000 * 60 * 5 // 5 minutes
    };

    // ✅ 5. SEND RESPONSE
    res.json({
      success: true,
      data: mixedBooks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}
function mixBooks(books, limit = 20) {
  const clean = books.filter(b => b && b.title);
  return clean.sort(() => 0.5 - Math.random()).slice(0, limit);
}


// Export the function
module.exports = {
  getAllTrending
};
