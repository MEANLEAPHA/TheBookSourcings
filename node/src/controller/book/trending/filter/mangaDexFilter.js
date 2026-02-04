const { fetchJson } = require('../../../../util/apiClient');

// Configuration
const USE_IMAGE_PROXY = true; // REQUIRED for MangaDex
const API_BASE_URL = 'https://api.mangadex.org';
const COVERS_BASE_URL = 'https://uploads.mangadex.org/covers';

// Helper: Get proxied cover URL (REQUIRED by MangaDex)
function getCoverUrl(originalUrl, mangaId) {
  if (!originalUrl) {
    // Return placeholder if no cover
    return '/api/proxy/placeholder?text=No+Cover&width=256&height=384';
  }
  
  // REQUIRED: Always use proxy for MangaDex images
  return `/api/proxy/mangadex-image?url=${encodeURIComponent(originalUrl)}&mangaId=${mangaId}`;
}

async function searchByMangaDexGenre(query, limit = 20) {
  try {
    console.log(`🔍 Searching MangaDex for genre: "${query}"`);
    
    // Direct search is more reliable than tag-based search
    const url = `${API_BASE_URL}/manga?limit=${limit}&title=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    
    console.log(`🌐 API Request: ${url}`);
    const data = await fetchJson(url);
    
    if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found for: "${query}"`);
      return [];
    }
     
    console.log(`✅ Found ${data.data.length} manga`);
    
    const results = [];
    
    for (const manga of data.data.slice(0, limit)) {
      const result = await processMangaData(manga, query);
      if (result) {
        console.log(`📖 Processed: ${result.title} - Cover: ${result.cover ? '✅' : '❌'}`);
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ MangaDex genre search error:', error.message);
    return [];
  }
}

async function processMangaData(manga, query) {
  try {
    // Get cover image
    let coverUrl = null;
    let coverFileName = null;
    
    // Find cover in relationships
    if (manga.relationships) {
      for (const rel of manga.relationships) {
        if (rel.type === 'cover_art' && rel.attributes?.fileName) {
          coverFileName = rel.attributes.fileName;
          // Original MangaDex cover URL (will be proxied)
          coverUrl = `${COVERS_BASE_URL}/${manga.id}/${coverFileName}`;
          break;
        }
      }
    }
    
    // Get authors
    let authors = ["Unknown Author"];
    if (manga.relationships) {
      const authorNames = [];
      for (const rel of manga.relationships) {
        if (rel.type === 'author' && rel.attributes?.name) {
          authorNames.push(rel.attributes.name);
        }
      }
      if (authorNames.length > 0) {
        authors = authorNames;
      }
    }
    
    // Get title
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 manga.attributes?.title?.ja ||
                 manga.attributes?.title?.ko ||
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    // Get description
    const description = manga.attributes?.description?.en || 
                       manga.attributes?.description?.['ja-ro'] || 
                       manga.attributes?.description?.ja || 
                       '';
    
    // Get genre from tags
    let genre = query;
    if (manga.attributes?.tags) {
      const genreTags = manga.attributes.tags
        ?.filter(tag => tag.attributes.group === 'genre')
        ?.map(tag => tag.attributes.name.en || tag.attributes.name.ja)
        ?.filter(name => name);
      
      if (genreTags && genreTags.length > 0) {
        genre = genreTags[0];
      }
    }
    
    // Get status
    const status = manga.attributes?.status || 'ongoing';
    
    // Get content rating
    const contentRating = manga.attributes?.contentRating || 'safe';
    
    // Create result object
    const result = {
      bookId: manga.id,
      title: title,
      cover: getCoverUrl(coverUrl, manga.id), // Proxied URL
      authors: authors,
      source: "mangadex",
      genre: genre,
      description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
      status: status,
      contentRating: contentRating,
      year: manga.attributes?.year || null,
      url: `https://mangadex.org/title/${manga.id}`,
      // Debug info
      _debug: {
        originalCover: coverUrl,
        hasCover: !!coverFileName,
        coverFilename: coverFileName,
        tagsCount: manga.attributes?.tags?.length || 0
      }
    };
    
    return result;
  } catch (error) {
    console.error(`Error processing manga ${manga?.id}:`, error.message);
    return null;
  }
}

async function searchByMangaDexAuthor(query, limit = 20) {
  try {
    console.log(`🔍 Searching MangaDex for author: "${query}"`);
    
    // First, search for authors
    const authorSearchUrl = `${API_BASE_URL}/author?limit=5&name=${encodeURIComponent(query)}`;
    console.log(`👤 Author search: ${authorSearchUrl}`);
    
    const authorData = await fetchJson(authorSearchUrl);
    
    if (!authorData.data || authorData.data.length === 0) {
      console.log(`❌ No authors found for: "${query}"`);
      // Fallback to title search
      return await searchByMangaDexGenre(query, limit);
    }
    
    const authorId = authorData.data[0].id;
    const authorName = authorData.data[0].attributes?.name || query;
    
    console.log(`✅ Found author: ${authorName} (ID: ${authorId})`);
    
    // Search manga by this author
    const mangaUrl = `${API_BASE_URL}/manga?limit=${limit}&authors[]=${authorId}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    
    console.log(`📚 Manga by author: ${mangaUrl}`);
    const mangaData = await fetchJson(mangaUrl);
    
    if (!mangaData.data || mangaData.data.length === 0) {
      console.log(`❌ No manga found for author: "${authorName}"`);
      return await searchByMangaDexGenre(query, limit);
    }
    
    console.log(`✅ Found ${mangaData.data.length} manga by ${authorName}`);
    
    const results = [];
    
    for (const manga of mangaData.data.slice(0, limit)) {
      const result = await processMangaData(manga, null);
      if (result) {
        // Override authors with the found author
        result.authors = [authorName];
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ MangaDex author search error:', error.message);
    // Fallback to genre search
    return await searchByMangaDexGenre(query, limit);
  }
}

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};