

// const {getOpenLibraryBookById} = require("./aboutOpenLibraryController")
// const {getGutenbergBookById} = require("./aboutGutenbergController")
// const {getOtthorById} = require("./aboutOtthorController")
// const {getMangaDexBookById} = require("./aboutMangaDexController")
// const {getInternetArchiveBookById} = require("./aboutInternetArchiveController")

// async function allAboutBook(req, res){
//   const { source, bookId } = req.params;
//   try {
//     const allowedSources = ["openlibrary", "gutenberg", "otthor", "mangadex", "internetarchive"];
//     if (!allowedSources.includes(source.toLowerCase())) {
//       return res.status(400).json({ error: "Unknown source" });
//     }

//     switch (source.toLowerCase()) {
//       case "otthor":
//         return await getOtthorById(req, res);
//       case "openlibrary":
//         return await getOpenLibraryBookById(req, res);
//       case "gutenberg":
//         return await getGutenbergBookById(req, res);
//       case "mangadex":
//         return await getMangaDexBookById(req, res);
//       case "internetarchive":
//         return await getInternetArchiveBookById(req, res);
//       default:
//         return res.status(400).json({ error: "Unknown source" });
//     }
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch book" });
//   }
// };

// module.exports = {allAboutBook};

const {getOpenLibraryBookById} = require("./aboutOpenLibraryController")
const {getGutenbergBookById} = require("./aboutGutenbergController")
const {getOtthorById} = require("./aboutOtthorController")
const {getMangaDexBookById} = require("./aboutMangaDexController")
const {getInternetArchiveBookById} = require("./aboutInternetArchiveController")

// Global timeout and concurrency control
const activeRequests = new Map();
const MAX_REQUEST_TIME = 10000; // 10 seconds max
const CONCURRENT_LIMIT = 5; // Max 5 concurrent requests per source

async function allAboutBook(req, res){
  const { source, bookId } = req.params;
  
  // Create request key for tracking
  const requestKey = `${source}:${bookId}`;
  
  try {
    // Check if this exact request is already in progress
    if (activeRequests.has(requestKey)) {
      console.log(`⏳ Request already in progress: ${requestKey}`);
      // Wait for the existing request to complete
      return activeRequests.get(requestKey);
    }
    
    const allowedSources = ["openlibrary", "gutenberg", "otthor", "mangadex", "internetarchive"];
    if (!allowedSources.includes(source.toLowerCase())) {
      return res.status(400).json({ error: "Unknown source" });
    }

    // Create a promise for this request
    const requestPromise = (async () => {
      try {
        console.log(`🚀 Starting request: ${requestKey}`);
        
        // Set timeout for the entire request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), MAX_REQUEST_TIME);
        });
        
        const sourcePromise = (async () => {
          switch (source.toLowerCase()) {
            case "otthor":
              return await getOtthorById(req, res);
            case "openlibrary":
              return await getOpenLibraryBookById(req, res);
            case "gutenberg":
              return await getGutenbergBookById(req, res);
            case "mangadex":
              return await getMangaDexBookById(req, res);
            case "internetarchive":
              return await getInternetArchiveBookById(req, res);
            default:
              return res.status(400).json({ error: "Unknown source" });
          }
        })();
        
        // Race between source request and timeout
        return await Promise.race([sourcePromise, timeoutPromise]);
      } finally {
        // Clean up request tracking
        activeRequests.delete(requestKey);
        console.log(`✅ Request completed: ${requestKey} (Active: ${activeRequests.size})`);
      }
    })();
    
    // Store the promise so duplicate requests can wait on it
    activeRequests.set(requestKey, requestPromise);
    
    return await requestPromise;
    
  } catch (err) {
    // Clean up on error
    activeRequests.delete(requestKey);
    
    if (err.message === 'Request timeout') {
      console.error(`⏰ Timeout: ${requestKey}`);
      return res.status(504).json({ 
        error: "Request timed out",
        source: source,
        bookId: bookId,
        suggestion: "Try again or use a different book"
      });
    }
    
    console.error(`❌ Error in allAboutBook: ${requestKey} - ${err.message}`);
    res.status(500).json({ 
      error: "Failed to fetch book",
      source: source,
      bookId: bookId 
    });
  }
};



module.exports = {
  allAboutBook
};