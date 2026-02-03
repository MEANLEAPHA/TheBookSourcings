const { fetchJson } = require("../../../util/apiClient");

async function getMangaDexBookById(req, res) {
  try {
    const { bookId } = req.params;
    const url = `https://api.mangadex.org/manga/${bookId}?includes[]=cover_art&includes[]=author`;
    const data = await fetchJson(url);

    if (!data || !data.data) {
      return res.status(404).json({ error: "No data about this Book" });
    }

    const manga = data.data;
    
    // Get cover image
    let cover = null;
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        cover = `https://uploads.mangadex.org/covers/${bookId}/${coverRel.attributes.fileName}`;
      }
    }
    
    // Get authors
    let authors = ["Unknown"];
    if (manga.relationships) {
      const authorRels = manga.relationships.filter(r => r.type === 'author');
      authors = authorRels.map(r => r.attributes?.name || 'Unknown').filter(name => name !== 'Unknown');
    }
    
    // Get title
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 manga.attributes?.title?.ja ||
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';

    // Get description
    const description = manga.attributes?.description?.en || 
                       manga.attributes?.description?.['ja-ro'] || 
                       manga.attributes?.description?.ja || 
                       null;

    // Get genres
    const categories = manga.attributes?.tags
      ?.filter(tag => tag.attributes.group === 'genre')
      ?.map(tag => tag.attributes.name.en || tag.attributes.name.ja)
      ?.filter(name => name) || [];

    const book = {
      source: "MangaDex",
      bookId: manga.id,
      title: title,
      subtitle: null,
      authors: authors,
      author_id: authors,
      description: description,
      cover: cover,
      categories: categories,
      language: manga.attributes?.originalLanguage || null,
      page: null,
      ISBN_10: null,
      ISBN_13: null,
      publishDate: manga.attributes?.year || null,
      publisher: null,
      read: `https://mangadex.org/title/${manga.id}`,
      download: null,
    };

    res.json({ book });
  } catch (err) {
    console.error("aboutMangaDexController.js Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch the book details",
      status: false,
    });
  }
}

module.exports = { getMangaDexBookById };