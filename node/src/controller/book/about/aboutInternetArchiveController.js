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
    
    // Get cover image
    let cover = null;
    if (data.files) {
      const coverFile = data.files.find(f => 
        f.format === 'Item Image' || 
        f.name.includes('cover') || 
        (f.name.match(/\.(jpg|jpeg|png)$/i) && f.name.includes('_cover'))
      );
      if (coverFile) {
        cover = `https://archive.org/download/${identifier}/${coverFile.name}`;
      }
    }
    
    // Get authors
    const authors = meta.creator ? 
      (Array.isArray(meta.creator) ? meta.creator : [meta.creator]) : 
      ["Unknown"];

    const book = {
      source: "Internet Archive",
      bookId: identifier,
      title: meta.title || null,
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: meta.description || null,
      cover: cover,
      categories: meta.subject ? 
        (Array.isArray(meta.subject) ? meta.subject : [meta.subject]) : 
        [],
      language: meta.language || null,
      page: meta.page_count || null,
      ISBN_10: meta.isbn ? (Array.isArray(meta.isbn) ? meta.isbn[0] : meta.isbn) : null,
      ISBN_13: null,
      publishDate: meta.date || meta.publicdate || null,
      publisher: meta.publisher || null,
      read: `https://archive.org/details/${identifier}`,
      download: `https://archive.org/download/${identifier}`,
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