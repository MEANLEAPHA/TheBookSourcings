// Import dependencies
const { getGoogleTrending } = require('./googleController');
const { getGutenbergTrending } = require('./gutenbergController');
const { getOpenLibraryTrending } = require('./openLibraryController');

// Define the controller function
async function getAllTrending(req, res) {
  try {
    // Fetch each source individually with error handling
    const google = await getGoogleTrending().catch(err => {
      console.error("Google Books fetch failed:", err.message || err);
      return [];
    });

    const gutenberg = await getGutenbergTrending().catch(err => {
      console.error("Gutenberg fetch failed:", err.message || err);
      return [];
    });

    const openLibrary = await getOpenLibraryTrending().catch(err => {
      console.error("OpenLibrary fetch failed:", err.message || err);
      return [];
    });

    console.log("Google books:", google.length);
    console.log("Gutenberg books:", gutenberg.length);
    console.log("OpenLibrary books:", openLibrary.length);

    res.json({
      success: true,
      data: {
        google,
        gutenberg,
        openLibrary
      }
    });
  } catch (err) {
    console.error("Unexpected error in getAllTrending:", err);
    res.status(500).json({ success: false, message: "Error fetching trending books" });
  }
}

// Export the function
module.exports = {
  getAllTrending
};
