const { fetchJson } = require("../../../util/apiClient");

async function getInternetArchiveBookById(req, res) {
  try {
    const { bookId } = req.params;
    
    // Handle ARK format
    const identifier = bookId.startsWith('ark:/') 
      ? bookId.replace('ark:/', '')
      : bookId;
    
    const url = `https://archive.org/metadata/${identifier}`;
    const data = await fetchJson(url);

    if (!data || !data.metadata) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const meta = data.metadata;
    
    // Get cover image - better search
    let cover = null;
    if (data.files) {
      // Try multiple patterns for cover
      const coverFile = data.files.find(f => 
        f.format === 'Item Image' || 
        f.name.toLowerCase().includes('cover') ||
        f.name.match(/cover\.(jpg|jpeg|png)$/i) ||
        f.name.match(/^\d+\.(jpg|jpeg|png)$/i) || // Like "001.jpg"
        (f.name.match(/\.(jpg|jpeg|png)$/i) && f.size < 500000) // Small image files
      );
      
      if (coverFile) {
        cover = `https://archive.org/download/${identifier}/${coverFile.name}`;
      } else {
        // Fallback to archive.org image service
        cover = `https://archive.org/services/img/${identifier}`;
      }
    } else {
      cover = `https://archive.org/services/img/${identifier}`;
    }
    
    // Get authors - handle complex strings
    let authors = ["Unknown"];
    if (meta.creator) {
      if (Array.isArray(meta.creator)) {
        authors = meta.creator;
      } else if (typeof meta.creator === 'string') {
        // Clean up long author descriptions
        if (meta.creator.length > 100) {
          // Try to extract first author from description
          const lines = meta.creator.split(/[,.;\n]/);
          authors = lines[0] ? [lines[0].trim()] : ["Unknown"];
        } else {
          authors = [meta.creator.trim()];
        }
      }
    }
    
    // Get description - handle object format
    let description = meta.description || null;
    if (description && typeof description === 'object') {
      description = description.value || null;
    }
    
    // Get categories/subjects
    let categories = [];
    if (meta.subject) {
      if (Array.isArray(meta.subject)) {
        categories = meta.subject;
      } else if (typeof meta.subject === 'string') {
        // Split comma-separated subjects
        categories = meta.subject.split(',').map(s => s.trim()).filter(s => s);
      }
    }
    
    // Get language - handle array format
    let language = null;
    if (meta.language) {
      if (Array.isArray(meta.language)) {
        language = meta.language[0];
      } else if (typeof meta.language === 'string') {
        language = meta.language;
      }
    }
    
    // Get page count - check multiple fields
    let page = meta.page_count || meta.number_of_pages || meta.pages || null;
    
    // Get ISBN - better extraction
    let ISBN_10 = null;
    let ISBN_13 = null;
    
    if (meta.isbn) {
      const isbns = Array.isArray(meta.isbn) ? meta.isbn : [meta.isbn];
      
      for (const isbn of isbns) {
        if (!isbn) continue;
        
        const cleanIsbn = isbn.toString().replace(/[-\s]/g, '');
        
        if (cleanIsbn.length === 10 && /^\d{9}[\dX]$/i.test(cleanIsbn)) {
          ISBN_10 = cleanIsbn.toUpperCase();
        } else if (cleanIsbn.length === 13 && /^\d{13}$/.test(cleanIsbn)) {
          ISBN_13 = cleanIsbn;
        }
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
    
    // Get publication date - prefer date over publicdate
    let publishDate = meta.date || meta.publicdate || meta.issue_date || null;
    
    const book = {
      source: "Internet Archive",
      bookId: identifier,
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
      publishDate: publishDate,
      publisher: publisher,
      read: `https://archive.org/details/${identifier}`,
      download: `https://archive.org/download/${identifier}`,
      // Additional metadata
      _extra: {
        mediatype: meta.mediatype,
        collection: meta.collection,
        scanner: meta.scanner,
        notes: meta.notes,
        avg_rating: meta.avg_rating,
        num_reviews: meta.num_reviews
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