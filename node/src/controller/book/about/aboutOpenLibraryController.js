// // controllers/openLibraryController.js
// const { fetchJson } = require("../../../util/apiClient");
// async function getOpenLibraryBookById(req, res) {
//   try {
//     const { bookId } = req.params;

//     // 1. Fetch Work data
//     const workUrl = `https://openlibrary.org/works/${bookId}.json`;
//     const workData = await fetchJson(workUrl);

//     if (!workData) {
//       return res.status(404).json({ error: "No data about this Book" });
//     }

//     // 2. Get first edition key from editions list
//     let editionData = null;
//     let editionKey = null;
//     let editionList = null; // DECLARE HERE
    
//     try {
//       const editionListUrl = `https://openlibrary.org/works/${bookId}/editions.json?limit=1`;
//       editionList = await fetchJson(editionListUrl); // STORE HERE

//       if (editionList?.entries?.length > 0) {
//         editionKey = editionList.entries[0].key;
//         const editionId = editionKey.replace("/books/", "");
//         const editionUrl = `https://openlibrary.org/books/${editionId}.json`;
//         editionData = await fetchJson(editionUrl);
//       }
//     } catch (err) {
//       console.warn("No edition data found for work:", bookId);
//     }

//     // 3. Fetch author names
//     const authorNames = await Promise.all(
//       (workData.authors || []).map(async (a) => {
//         const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
//         return authorData.name || "Unknown";
//       })
//     );

//     // 4. Build read & download links
//     let read = null;
//     let download = null;

//     if (editionData?.ocaid) {
//       const ocaid = editionData.ocaid;
//       read = `https://archive.org/details/${ocaid}`;
//       download = `https://archive.org/download/${ocaid}/${ocaid}.pdf`;
//     } else if (editionData?.ebooks?.length > 0) {
//       const ebook = editionData.ebooks[0];
//       if (ebook?.preview_url) read = ebook.preview_url;
//       if (ebook?.formats?.pdf) download = ebook.formats.pdf;
//     }

//     let cover = null;

//     // Try work cover first
//     if (workData?.covers?.length > 0) {
//       cover = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
//     }
//     // If no work cover, try edition cover
//     else if (editionList?.entries?.[0]?.covers?.length > 0) {
//       cover = `https://covers.openlibrary.org/b/id/${editionList.entries[0].covers[0]}-L.jpg`;
//     }
//     // Else leave it null, or point to a placeholder
//     else {
//       cover = "/img/noCoverFound.png"; // optional
//     }

//     // 5. Build response
//     const book = {
//       source: "Open Library",
//       workUrl: `https://openlibrary.org/works/${bookId}`,
//       editionUrl: editionKey ? `https://openlibrary.org${editionKey}` : null,
//       bookId: workData.key || bookId,
//       title: workData.title || null,
//       subtitle: editionData?.subtitle || null,
//       authors: authorNames,
//       author_id: authorNames,
//       description:
//         typeof workData.description === "string"
//           ? workData.description
//           : workData.description?.value || null,
//       cover,
//       categories: workData.subjects?.slice(1,5) || [],
//       language: editionData?.languages?.[0]?.key?.replace("/languages/", "") || null,
//       page: editionData?.pagination || editionData?.number_of_pages || null,
//       ISBN_10: editionData?.isbn_10 ? editionData.isbn_10[0] : null,
//       ISBN_13: editionData?.isbn_13 ? editionData.isbn_13[0] : null,
//       publishDate: editionData?.publish_date || null,
//       publisher: editionData?.publishers ? editionData.publishers[0] : null,
//       read,
//       download,
//     };

//     res.json({ book });
//   } catch (err) {
//     console.error("openLibraryController.js Error:", err.message);
//     return res.status(500).json({
//       error: "Failed to fetch the book data",
//       status: false,
//     });
//   }
// }
// module.exports = { getOpenLibraryBookById };


const { fetchJson } = require("../../../util/apiClient");

// Cache for Open Library book data
const openLibraryCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache (longer than IA)

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of openLibraryCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      openLibraryCache.delete(key);
    }
  }
}, 60 * 1000);

async function getOpenLibraryBookById(req, res) {
  try {
    const { bookId } = req.params;

    // CHECK CACHE FIRST
    if (openLibraryCache.has(bookId)) {
      const cached = openLibraryCache.get(bookId);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Open Library cache hit: ${bookId}`);
        return res.json({ book: cached.data });
      }
    }

    console.log(`🌐 Fetching Open Library: ${bookId}`);

    // 1. Fetch Work data
    const workUrl = `https://openlibrary.org/works/${bookId}.json`;
    const workData = await fetchJson(workUrl);

    if (!workData) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    // 2. Get first edition key from editions list
    let editionData = null;
    let editionKey = null;
    let editionList = null;
    
    try {
      const editionListUrl = `https://openlibrary.org/works/${bookId}/editions.json?limit=1`;
      editionList = await fetchJson(editionListUrl);

      if (editionList?.entries?.length > 0) {
        editionKey = editionList.entries[0].key;
        const editionId = editionKey.replace("/books/", "");
        const editionUrl = `https://openlibrary.org/books/${editionId}.json`;
        editionData = await fetchJson(editionUrl);
      }
    } catch (err) {
      console.warn("No edition data found for work:", bookId);
    }

    // 3. Fetch author names - in parallel for speed
    const authorPromises = (workData.authors || []).map(async (a) => {
      try {
        const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
        return authorData.name || "Unknown";
      } catch {
        return "Unknown";
      }
    });
    
    const authorNames = await Promise.all(authorPromises);

    // 4. Build read & download links
    let read = null;
    let download = null;

    if (editionData?.ocaid) {
      const ocaid = editionData.ocaid;
      read = `https://archive.org/details/${ocaid}`;
      download = `https://archive.org/download/${ocaid}/${ocaid}.pdf`;
    } else if (editionData?.ebooks?.length > 0) {
      const ebook = editionData.ebooks[0];
      if (ebook?.preview_url) read = ebook.preview_url;
      if (ebook?.formats?.pdf) download = ebook.formats.pdf;
    }

    let cover = null;

    // Try work cover first
    if (workData?.covers?.length > 0) {
      cover = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
    }
    // If no work cover, try edition cover
    else if (editionList?.entries?.[0]?.covers?.length > 0) {
      cover = `https://covers.openlibrary.org/b/id/${editionList.entries[0].covers[0]}-L.jpg`;
    }
    // Else use placeholder
    else {
      cover = "/img/noCoverFound.png";
    }

    // 5. Build response
    const book = {
      source: "Open Library",
      workUrl: `https://openlibrary.org/works/${bookId}`,
      editionUrl: editionKey ? `https://openlibrary.org${editionKey}` : null,
      bookId: workData.key || bookId,
      title: workData.title || null,
      subtitle: editionData?.subtitle || null,
      authors: authorNames,
      author_id: authorNames,
      description:
        typeof workData.description === "string"
          ? workData.description
          : workData.description?.value || null,
      cover,
      categories: workData.subjects?.slice(0, 5) || [], // Take first 5, not 1-5
      language: editionData?.languages?.[0]?.key?.replace("/languages/", "") || null,
      page: editionData?.pagination || editionData?.number_of_pages || null,
      ISBN_10: editionData?.isbn_10 ? editionData.isbn_10[0] : null,
      ISBN_13: editionData?.isbn_13 ? editionData.isbn_13[0] : null,
      publishDate: editionData?.publish_date || null,
      publisher: editionData?.publishers ? editionData.publishers[0] : null,
      read,
      download,
      _cached: true,
      _fetchedAt: new Date().toISOString()
    };

    // STORE IN CACHE
    openLibraryCache.set(bookId, {
      data: book,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (openLibraryCache.size > 150) {
      const firstKey = openLibraryCache.keys().next().value;
      openLibraryCache.delete(firstKey);
    }

    console.log(`✅ Open Library fetched and cached: ${bookId} (Cache size: ${openLibraryCache.size})`);
    res.json({ book });
  } catch (err) {
    console.error("openLibraryController.js Error:", err.message);
    
    // Try to serve from cache even if stale on error
    if (openLibraryCache.has(bookId)) {
      console.log(`🔄 Serving stale cache due to error: ${bookId}`);
      const cached = openLibraryCache.get(bookId);
      cached.data._stale = true;
      return res.json({ book: cached.data });
    }
    
    res.status(500).json({
      error: "Failed to fetch the book data",
      status: false,
    });
  }
}

// Cache stats endpoint (optional)
function getOpenLibraryCacheStats(req, res) {
  res.json({
    cacheSize: openLibraryCache.size,
    cacheDuration: `${CACHE_DURATION / 60000} minutes`,
    cacheKeys: Array.from(openLibraryCache.keys()).slice(0, 10) // First 10 keys
  });
}

module.exports = { 
  getOpenLibraryBookById,
  getOpenLibraryCacheStats // Optional
};