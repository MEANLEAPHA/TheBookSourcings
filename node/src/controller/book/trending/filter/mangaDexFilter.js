const { fetchJson } = require('../../../../util/apiClient');

async function searchByMangaDexGenre(query, limit = 20) {
  try {
    if (!query) return [];

    const url = `https://api.mangadex.org/manga?limit=${limit}&includedTagsMode=AND&includedTags[]=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&order[rating]=desc`;

    console.log(`🔍 MangaDex Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data.data) return [];
    
    return data.data.map((manga) => {
      let cover = null;
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
        }
      }

      const title = manga.attributes?.title?.en || 
                    manga.attributes?.title?.ja || 
                    manga.attributes?.title?.['ja-ro'] || 
                    Object.values(manga.attributes?.title || {})[0] || 
                    'Unknown Title';

      return {
        bookId: manga.id,
        title: title,
        cover: cover,
        authors: manga.relationships
          ?.filter(r => r.type === 'author' || r.type === 'artist')
          ?.map(r => r.attributes?.name || 'Unknown') || ["Unknown"],
        source: "mangadex",
        genre: manga.attributes?.tags
          ?.filter(tag => tag.attributes.group === 'genre')
          ?.map(tag => tag.attributes.name.en)[0] || query
      };
    });
  } catch (error) {
    console.error('MangaDex genre search error:', error.message);
    return [];
  }
}

async function searchByMangaDexAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    // First search for authors
    const authorSearchUrl = `https://api.mangadex.org/author?limit=5&name=${encodeURIComponent(query)}`;
    const authorData = await fetchJson(authorSearchUrl);
    
    if (!authorData.data || authorData.data.length === 0) return [];
    
    const authorId = authorData.data[0].id;
    
    // Then get manga by author
    const mangaUrl = `https://api.mangadex.org/manga?limit=${limit}&authors[]=${authorId}&contentRating[]=safe&contentRating[]=suggestive&order[rating]=desc`;
    
    console.log(`🔍 MangaDex Author URL: ${mangaUrl}`);
    
    const data = await fetchJson(mangaUrl);
    
    if (!data.data) return [];
    
    return data.data.map((manga) => {
      let cover = null;
      if (manga.relationships) {
        const coverRel = manga.relationships.find(r => r.type === 'cover_art');
        if (coverRel?.attributes?.fileName) {
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
        }
      }

      const title = manga.attributes?.title?.en || 
                    manga.attributes?.title?.ja || 
                    manga.attributes?.title?.['ja-ro'] || 
                    Object.values(manga.attributes?.title || {})[0] || 
                    'Unknown Title';

      return {
        bookId: manga.id,
        title: title,
        cover: cover,
        authors: [authorData.data[0].attributes?.name || query],
        source: "mangadex",
        genre: manga.attributes?.tags
          ?.filter(tag => tag.attributes.group === 'genre')
          ?.map(tag => tag.attributes.name.en)[0] || null
      };
    });
  } catch (error) {
    console.error('MangaDex author search error:', error.message);
    return [];
  }
}

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};