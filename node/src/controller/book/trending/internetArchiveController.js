// const { fetchJson } = require('../../../util/apiClient');
// async function getInternetArchiveTrending() {
//   const url = "https://archive.org/advancedsearch.php?q=mediatype:texts&output=json&rows=20&sort[]=week+desc&fl[]=identifier,title,creator,avg_rating,week";
//   const data = await fetchJson(url);
  
//   if (!data?.response?.docs) return [];
  
//   return data.response.docs.map(doc => ({
//     source: "internetarchive",
//     bookId: doc.identifier,
//     title: doc.title || "Unknown Title",
//     authors: doc.creator ? (Array.isArray(doc.creator) ? doc.creator : [doc.creator]) : ["Unknown"],
//     cover: `https://archive.org/services/img/${doc.identifier}`,
//     viewsThisWeek: doc.week || 0
//   }));
// }

// module.exports = {getInternetArchiveTrending};
const { fetchJson } = require("../../../util/apiClient");

async function getInternetArchiveBookById(req, res) {
  try {
    const { bookId } = req.params;
    
    // Use the metadata endpoint for complete data
    const url = `https://archive.org/metadata/${bookId}`;
    const data = await fetchJson(url);

    if (!data || !data.metadata) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const meta = data.metadata;
    const files = data.files || [];
    
    // Get cover image from files
    let cover = null;
    const coverFile = files.find(f => 
      f.format === 'Item Image' || 
      f.name.includes('cover') || 
      (f.name.match(/\.(jpg|jpeg|png)$/i) && (
        f.name.includes('_cover') || 
        f.name.includes('cover_') || 
        f.name.toLowerCase().startsWith('cover')
      ))
    );
    
    if (coverFile) {
      cover = `https://archive.org/download/${bookId}/${coverFile.name}`;
    } else {
      // Fallback to archive.org services image
      cover = `https://archive.org/services/img/${bookId}`;
    }
    
    // Get PDF download link
    let download = null;
    const pdfFile = files.find(f => 
      f.format === 'Text PDF' || 
      f.name.match(/\.pdf$/i)
    );
    if (pdfFile) {
      download = `https://archive.org/download/${bookId}/${pdfFile.name}`;
    }
    
    // Get authors - handle various formats
    let authors = ["Unknown"];
    if (meta.creator) {
      if (Array.isArray(meta.creator)) {
        authors = meta.creator;
      } else if (typeof meta.creator === 'string') {
        // Sometimes creator is a long string with description
        if (meta.creator.length > 100) {
          // Try to extract author name from description
          const match = meta.creator.match(/^(.*?)(?:,|\.|$)/);
          authors = match ? [match[1].trim()] : ["Unknown"];
        } else {
          authors = [meta.creator];
        }
      }
    }
    
    // Get categories/subjects
    let categories = [];
    if (meta.subject) {
      if (Array.isArray(meta.subject)) {
        categories = meta.subject;
      } else if (typeof meta.subject === 'string') {
        categories = [meta.subject];
      }
    }
    
    // Get description - handle various formats
    let description = null;
    if (meta.description) {
      if (typeof meta.description === 'string') {
        description = meta.description;
      } else if (meta.description.value) {
        description = meta.description.value;
      }
    }
    
    // Get language
    let language = null;
    if (meta.language) {
      if (Array.isArray(meta.language)) {
        language = meta.language[0];
      } else {
        language = meta.language;
      }
    }
    
    // Get page count
    let page = null;
    if (meta.page_count) {
      page = meta.page_count;
    } else if (meta.number_of_pages) {
      page = meta.number_of_pages;
    }
    
    // Get ISBN
    let ISBN_10 = null;
    let ISBN_13 = null;
    if (meta.isbn) {
      if (Array.isArray(meta.isbn)) {
        meta.isbn.forEach(isbn => {
          const cleanIsbn = isbn.replace(/[-\s]/g, '');
          if (cleanIsbn.length === 10) ISBN_10 = cleanIsbn;
          if (cleanIsbn.length === 13) ISBN_13 = cleanIsbn;
        });
      } else {
        const cleanIsbn = meta.isbn.replace(/[-\s]/g, '');
        if (cleanIsbn.length === 10) ISBN_10 = cleanIsbn;
        if (cleanIsbn.length === 13) ISBN_13 = cleanIsbn;
      }
    }
    
    // Get publisher
    let publisher = null;
    if (meta.publisher) {
      if (Array.isArray(meta.publisher)) {
        publisher = meta.publisher[0];
      } else {
        publisher = meta.publisher;
      }
    }
    
    const book = {
      source: "Internet Archive",
      bookId: bookId,
      title: meta.title || "Unknown Title",
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: description,
      cover: cover,
      categories: categories,
      language: language,
      page: page,
      ISBN_10: ISBN_10,
      ISBN_13: ISBN_13,
      publishDate: meta.date || meta.publicdate || null,
      publisher: publisher,
      read: `https://archive.org/details/${bookId}`,
      download: download || `https://archive.org/download/${bookId}`,
      // Additional Internet Archive specific fields
      _archive: {
        avg_rating: meta.avg_rating || null,
        views: meta.week || meta.scanner || null,
        mediatype: meta.mediatype || 'texts',
        collection: meta.collection || [],
        contributor: meta.contributor || null
      }
    };

    res.json({ book });
  } catch (err) {
    console.error("aboutInternetArchiveController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

module.exports = { getInternetArchiveBookById };