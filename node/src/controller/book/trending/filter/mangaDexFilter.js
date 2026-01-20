const { fetchJson } = require('../../../../util/apiClient');

async function searchByMangaDexGenre(query, limit = 20) {
  try {
    if (!query) return [];

    // First, we need to find the tag ID for the genre
    const tagSearchUrl = `https://api.mangadex.org/manga/tag?limit=50`;
    const tagData = await fetchJson(tagSearchUrl);
    
    if (!tagData.data) return [];
    
    // Find tag by name (case insensitive)
    const tag = tagData.data.find(t => 
      t.attributes.name.en.toLowerCase().includes(query.toLowerCase()) ||
      t.attributes.name.es?.toLowerCase().includes(query.toLowerCase()) ||
      t.attributes.name.pt?.toLowerCase().includes(query.toLowerCase())
    );
    
    if (!tag) return [];
    
    // Search manga by tag ID
    const url = `https://api.mangadex.org/manga?limit=${limit}&includedTags[]=${tag.id}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
    
    console.log(`🔍 MangaDex Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data.data) return [];
    
    const results = [];
    for (const manga of data.data.slice(0, limit)) {
      let cover = null;
      
      // Get cover image
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
        } else {
          // Fetch cover separately
          const coverUrl = `https://api.mangadex.org/cover?limit=1&manga[]=${manga.id}&order[createdAt]=desc`;
          const coverData = await fetchJson(coverUrl);
          if (coverData.data?.[0]?.attributes?.fileName) {
            cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverData.data[0].attributes.fileName}.256.jpg`;
          }
        }
      }
      
      // Get authors
      let authors = [];
      if (manga.relationships) {
        const authorRels = manga.relationships.filter(r => r.type === 'author');
        authors = authorRels.map(r => r.attributes?.name || 'Unknown');
      }
      
      const title = manga.attributes?.title?.en || 
                   Object.values(manga.attributes?.title || {})[0] || 
                   'Unknown Title';
      
      results.push({
        bookId: manga.id,
        title: title,
        cover: cover,
        authors: authors.length > 0 ? authors : ["Unknown"],
        source: "mangadex",
        genre: query
      });
    }
    
    return results;
  } catch (error) {
    console.error('MangaDex genre search error:', error.message);
    return [];
  }
}

async function searchByMangaDexAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    // Search for authors
    const authorSearchUrl = `https://api.mangadex.org/author?limit=5&name=${encodeURIComponent(query)}`;
    const authorData = await fetchJson(authorSearchUrl);
    
    if (!authorData.data || authorData.data.length === 0) return [];
    
    const authorIds = authorData.data.map(author => author.id);
    
    // Search manga by author IDs
    const url = `https://api.mangadex.org/manga?limit=${limit}&authors[]=${authorIds[0]}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`;
    
    console.log(`🔍 MangaDex Author URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data.data) return [];
    
    const authorName = authorData.data[0]?.attributes?.name || query;
    
    const results = [];
    for (const manga of data.data.slice(0, limit)) {
      let cover = null;
      
      // Get cover image
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
        }
      }
      
      const title = manga.attributes?.title?.en || 
                   Object.values(manga.attributes?.title || {})[0] || 
                   'Unknown Title';
      
      results.push({
        bookId: manga.id,
        title: title,
        cover: cover,
        authors: [authorName],
        source: "mangadex",
        genre: manga.attributes?.tags
          ?.filter(tag => tag.attributes.group === 'genre')
          ?.map(tag => tag.attributes.name.en)[0] || null
      });
    }
    
    return results;
  } catch (error) {
    console.error('MangaDex author search error:', error.message);
    return [];
  }
}

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};