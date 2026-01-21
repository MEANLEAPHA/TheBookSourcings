const { fetchJson } = require('../../../../util/apiClient');

async function searchByMangaDexGenre(query, limit = 20) {
  try {
    if (!query) return [];

    console.log(`🔍 Searching MangaDex for genre: "${query}"`);
    
    // Clean and prepare the query
    const cleanQuery = query.toLowerCase().trim();
    
    // First, get ALL available tags to find matching ones
    const tagSearchUrl = `https://api.mangadex.org/manga/tag`;
    const tagData = await fetchJson(tagSearchUrl);
    
    if (!tagData.data) {
      console.log('❌ No tag data found');
      return [];
    }
    
    // Find ALL tags that match the query (partial matches)
    const matchingTags = tagData.data.filter(t => {
      if (!t.attributes?.name) return false;
      
      // Check all available language fields
      const nameEn = t.attributes.name.en?.toLowerCase() || '';
      const nameJa = t.attributes.name.ja?.toLowerCase() || '';
      const nameKo = t.attributes.name.ko?.toLowerCase() || '';
      
      // Check if query is included in any language version
      return nameEn.includes(cleanQuery) || 
             cleanQuery.includes(nameEn) ||
             nameJa.includes(cleanQuery) || 
             cleanQuery.includes(nameJa) ||
             nameKo.includes(cleanQuery) || 
             cleanQuery.includes(nameKo);
    });
    
    if (matchingTags.length === 0) {
      console.log(`❌ No matching tags found for genre: "${query}"`);
      // Try direct search instead
      return await searchMangaDirectly(query, limit);
    }
    
    console.log(`✅ Found ${matchingTags.length} matching tags for "${query}"`);
    
    // Get tag IDs
    const tagIds = matchingTags.map(tag => tag.id);
    
    // Search manga that include ANY of the matching tags
    // Note: MangaDex API requires includedTags[] parameter for each tag
    let url = `https://api.mangadex.org/manga?limit=${limit}&includedTags[]=${tagIds[0]}`;
    
    // Add additional tags if more than one
    for (let i = 1; i < Math.min(tagIds.length, 3); i++) {
      url += `&includedTags[]=${tagIds[i]}`;
    }
    
    url += `&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    
    console.log(`🔍 MangaDex Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found with tags: "${query}"`);
      return await searchMangaDirectly(query, limit);
    }
    
    console.log(`✅ Found ${data.data.length} manga with genre "${query}"`);
    
    const results = [];
    
    // Process each manga
    for (const manga of data.data.slice(0, limit)) {
      const result = await processMangaData(manga, query);
      if (result) results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('❌ MangaDex genre search error:', error.message);
    return [];
  }
}

// Helper: Search manga directly by title/keyword
async function searchMangaDirectly(query, limit = 20) {
  try {
    console.log(`🔍 Searching manga directly: "${query}"`);
    
    const url = `https://api.mangadex.org/manga?limit=${limit}&title=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    
    const data = await fetchJson(url);
    
    if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found for: "${query}"`);
      return [];
    }
    
    console.log(`✅ Found ${data.data.length} manga by direct search`);
    
    const results = [];
    
    for (const manga of data.data.slice(0, limit)) {
      const result = await processMangaData(manga, query);
      if (result) results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Direct search error:', error.message);
    return [];
  }
}

// Helper: Process manga data
async function processMangaData(manga, query) {
  try {
    // Get cover image - CORRECT WAY
    let cover = null;
    
    // Check relationships for cover_art
    if (manga.relationships) {
      for (const rel of manga.relationships) {
        if (rel.type === 'cover_art' && rel.attributes?.fileName) {
          const fileName = rel.attributes.fileName;
          // MangaDex cover URLs: https://uploads.mangadex.org/covers/{manga-id}/{filename}
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
          console.log(`📸 Cover found: ${cover}`);
          break;
        }
      }
    }
    
    // Get authors
    let authors = ["Unknown"];
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
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    // Get genre from tags
    let genre = query;
    if (manga.attributes?.tags) {
      const genreTags = manga.attributes.tags
        .filter(tag => tag.attributes.group === 'genre')
        .map(tag => tag.attributes.name.en || tag.attributes.name.ja)
        .filter(name => name);
      
      if (genreTags.length > 0) {
        genre = genreTags[0];
      }
    }
    
    // Get description
    const description = manga.attributes?.description?.en || 
                       manga.attributes?.description?.['ja-ro'] || 
                       manga.attributes?.description?.ja || 
                       '';
    
    // Get status
    const status = manga.attributes?.status || 'ongoing';
    
    // Get content rating
    const contentRating = manga.attributes?.contentRating || 'safe';
    
    return {
      bookId: manga.id,
      title: title,
      cover: cover,
      authors: authors,
      source: "mangadex",
      genre: genre,
      description: description,
      status: status,
      contentRating: contentRating,
      url: `https://mangadex.org/title/${manga.id}`
    };
  } catch (error) {
    console.error(`Error processing manga ${manga?.id}:`, error.message);
    return null;
  }
}

async function searchByMangaDexAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    console.log(`🔍 Searching MangaDex for author: "${query}"`);
    
    // Search for authors
    const authorSearchUrl = `https://api.mangadex.org/author?limit=10&name=${encodeURIComponent(query)}`;
    const authorData = await fetchJson(authorSearchUrl);
    
    if (!authorData.data || authorData.data.length === 0) {
      console.log(`❌ No authors found for: "${query}"`);
      return await searchMangaDirectly(query, limit);
    }
    
    console.log(`✅ Found ${authorData.data.length} authors matching "${query}"`);
    
    // Get author IDs
    const authorIds = authorData.data.map(author => author.id);
    const authorName = authorData.data[0]?.attributes?.name || query;
    
    // Search manga by author IDs
    let url = `https://api.mangadex.org/manga?limit=${limit}&authors[]=${authorIds[0]}`;
    
    // Add additional authors if more than one
    for (let i = 1; i < Math.min(authorIds.length, 3); i++) {
      url += `&authors[]=${authorIds[i]}`;
    }
    
    url += `&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
    
    console.log(`🔍 MangaDex Author URL: ${url}`);
    
    const mangaData = await fetchJson(url);
    
    if (!mangaData.data || mangaData.data.length === 0) {
      console.log(`❌ No manga found for author: "${authorName}"`);
      return await searchMangaDirectly(query, limit);
    }
    
    console.log(`✅ Found ${mangaData.data.length} manga for author "${authorName}"`);
    
    const results = [];
    
    // Process each manga
    for (const manga of mangaData.data.slice(0, limit)) {
      const result = await processMangaData(manga, null);
      if (result) {
        // Override authors with the searched author
        result.authors = [authorName];
        results.push(result);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ MangaDex author search error:', error.message);
    return [];
  }
}

// Debug function to test the API
async function testMangaDexAPI() {
  try {
    console.log('🧪 Testing MangaDex API...');
    
    // Test 1: Get a single manga to see the structure
    const testMangaId = 'f9c33607-3ad3-42a8-9e25-5b8bcd4f4b4a'; // Example manga ID
    const testUrl = `https://api.mangadex.org/manga/${testMangaId}?includes[]=cover_art&includes[]=author`;
    
    console.log(`Test URL: ${testUrl}`);
    const testData = await fetchJson(testUrl);
    
    console.log('Test manga data structure:');
    console.log('- ID:', testData.data?.id);
    console.log('- Title:', testData.data?.attributes?.title);
    console.log('- Relationships:', testData.data?.relationships?.map(r => ({
      type: r.type,
      id: r.id,
      fileName: r.attributes?.fileName,
      name: r.attributes?.name
    })));
    
    // Test 2: Get cover URL
    if (testData.data?.relationships) {
      const coverRel = testData.data.relationships.find(r => r.type === 'cover_art');
      if (coverRel) {
        console.log('Cover relationship found:', coverRel);
        const coverUrl = `https://uploads.mangadex.org/covers/${testMangaId}/${coverRel.attributes?.fileName}`;
        console.log('Cover URL:', coverUrl);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Uncomment to test
// testMangaDexAPI();

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};