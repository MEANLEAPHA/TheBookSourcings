const { fetchJson } = require('../../../../util/apiClient');

async function searchByMangaDexGenre(query, limit = 20) {
  try {
    if (!query) return [];

    console.log(`🔍 Searching MangaDex for genre: "${query}"`);
    
    // Clean and prepare the query
    const cleanQuery = query.toLowerCase().trim();
    
    // First, get ALL available tags to find matching ones
    const tagSearchUrl = `https://api.mangadex.org/manga/tag?limit=100`;
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
      const nameEs = t.attributes.name.es?.toLowerCase() || '';
      const namePt = t.attributes.name.pt?.toLowerCase() || '';
      const nameRu = t.attributes.name.ru?.toLowerCase() || '';
      
      // Check if query is included in any language version OR
      // if any language version is included in the query
      return nameEn.includes(cleanQuery) || 
             cleanQuery.includes(nameEn) ||
             nameJa.includes(cleanQuery) || 
             cleanQuery.includes(nameJa) ||
             nameKo.includes(cleanQuery) || 
             cleanQuery.includes(nameKo) ||
             nameEs.includes(cleanQuery) || 
             cleanQuery.includes(nameEs) ||
             namePt.includes(cleanQuery) || 
             cleanQuery.includes(namePt) ||
             nameRu.includes(cleanQuery) || 
             cleanQuery.includes(nameRu);
    });
    
    if (matchingTags.length === 0) {
      console.log(`❌ No matching tags found for genre: "${query}"`);
      console.log('Available tags (first 10):', tagData.data.slice(0, 10).map(t => t.attributes.name.en || t.attributes.name.ja));
      
      // Fallback: Search manga by title/keyword and extract genres
      console.log(`🔄 Trying fallback search by keyword...`);
      return await searchMangaByKeywordAndExtractGenre(query, limit);
    }
    
    console.log(`✅ Found ${matchingTags.length} matching tags for "${query}":`, 
                matchingTags.map(t => t.attributes.name.en || t.attributes.name.ja));
    
    // Get tag IDs
    const tagIds = matchingTags.map(tag => tag.id);
    
    // Search manga that include ANY of the matching tags
    const tagParams = tagIds.map(id => `includedTags[]=${id}`).join('&');
    const url = `https://api.mangadex.org/manga?limit=${limit}&${tagParams}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&order[followedCount]=desc&includes[]=cover_art`;
    
    console.log(`🔍 MangaDex Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found with tags: "${query}"`);
      
      // Try with a simpler approach: just search manga by keyword
      return await searchMangaByKeywordAndExtractGenre(query, limit);
    }
    
    console.log(`✅ Found ${data.data.length} manga with genre "${query}"`);
    
    const results = [];
    
    // Process manga in batches
    for (const manga of data.data.slice(0, limit)) {
      const result = await processMangaWithCover(manga, query);
      if (result) results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('❌ MangaDex genre search error:', error.message);
    return [];
  }
}

// Helper: Search manga by keyword and extract matching genre
async function searchMangaByKeywordAndExtractGenre(query, limit = 20) {
  try {
    console.log(`🔍 Searching manga by keyword: "${query}"`);
    
    const url = `https://api.mangadex.org/manga?limit=${limit * 2}&title=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&order[followedCount]=desc&includes[]=cover_art`;
    
    const data = await fetchJson(url);
    
    if (!data.data || data.data.length === 0) {
      console.log(`❌ No manga found by keyword: "${query}"`);
      return [];
    }
    
    console.log(`✅ Found ${data.data.length} manga by keyword "${query}"`);
    
    const results = [];
    const cleanQuery = query.toLowerCase();
    
    for (const manga of data.data.slice(0, limit * 2)) {
      // Check if manga has tags that match the query
      const matchingGenre = manga.attributes?.tags
        ?.filter(tag => tag.attributes.group === 'genre')
        ?.map(tag => {
          const nameEn = tag.attributes.name.en?.toLowerCase() || '';
          const nameJa = tag.attributes.name.ja?.toLowerCase() || '';
          return (nameEn.includes(cleanQuery) || cleanQuery.includes(nameEn) ||
                  nameJa.includes(cleanQuery) || cleanQuery.includes(nameJa)) 
                 ? tag.attributes.name.en || tag.attributes.name.ja 
                 : null;
        })
        ?.find(genre => genre !== null);
      
      // Only include manga that actually has the genre
      if (matchingGenre) {
        const result = await processMangaWithCover(manga, matchingGenre);
        if (result) {
          results.push(result);
          if (results.length >= limit) break;
        }
      }
    }
    
    console.log(`✅ Extracted ${results.length} manga with genre "${query}" from keyword search`);
    return results;
  } catch (error) {
    console.error('Keyword search error:', error.message);
    return [];
  }
}

// Helper: Process a single manga with cover image
async function processMangaWithCover(manga, genre) {
  try {
    // Get cover image - THIS IS THE FIXED PART
    let cover = null;
    
    // Method 1: Check if cover_art is included in relationships
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        const fileName = coverRel.attributes.fileName;
        // MangaDex cover URLs work like this
        cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
        
        // Test if the cover exists by trying different formats
        const coverFormats = [
          cover,
          `${cover}.jpg`,
          `${cover}.png`,
          `${cover}.256.jpg`,
          `${cover}.512.jpg`
        ];
        
        // You could test which URL works, but for now use the first one
        console.log(`📸 Cover URL for ${manga.id}: ${cover}`);
      }
    }
    
    // Method 2: If no cover in relationships, fetch it separately
    if (!cover) {
      try {
        const coverUrl = `https://api.mangadex.org/cover?limit=1&manga[]=${manga.id}&order[createdAt]=desc`;
        const coverData = await fetchJson(coverUrl);
        if (coverData.data?.[0]?.attributes?.fileName) {
          const fileName = coverData.data[0].attributes.fileName;
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
          console.log(`📸 Fetched cover separately for ${manga.id}: ${cover}`);
        }
      } catch (coverError) {
        console.log(`⚠️ Could not fetch cover for manga ${manga.id}: ${coverError.message}`);
      }
    }
    
    // Get authors
    let authors = ["Unknown"];
    if (manga.relationships) {
      // Find author relationships
      const authorRels = manga.relationships.filter(r => r.type === 'author');
      
      if (authorRels.length > 0) {
        // Try to get author names from the relationships if available
        const authorNames = authorRels
          .map(r => r.attributes?.name)
          .filter(name => name && name !== 'Unknown');
        
        if (authorNames.length > 0) {
          authors = authorNames;
        } else {
          // If names not in relationships, fetch author details
          const authorIds = authorRels.map(r => r.id).filter(id => id);
          if (authorIds.length > 0) {
            try {
              const authorsUrl = `https://api.mangadex.org/author?ids[]=${authorIds.join('&ids[]=')}`;
              const authorsData = await fetchJson(authorsUrl);
              if (authorsData.data) {
                authors = authorsData.data.map(a => a.attributes?.name || 'Unknown').filter(name => name !== 'Unknown');
              }
            } catch (authorError) {
              console.log(`⚠️ Could not fetch authors for manga ${manga.id}: ${authorError.message}`);
            }
          }
        }
      }
    }
    
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 manga.attributes?.title?.ja ||
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    // Extract actual genre from manga if available
    let actualGenre = genre;
    if (manga.attributes?.tags) {
      const genreTags = manga.attributes.tags
        .filter(tag => tag.attributes.group === 'genre')
        .map(tag => tag.attributes.name.en || tag.attributes.name.ja)
        .filter(name => name);
      
      if (genreTags.length > 0) {
        actualGenre = genreTags[0];
      }
    }
    
    // Also include a link to the manga on MangaDex
    const mangaLink = `https://mangadex.org/title/${manga.id}`;
    
    return {
      bookId: manga.id,
      title: title,
      cover: cover,
      authors: authors.length > 0 ? authors : ["Unknown"],
      source: "mangadex",
      genre: actualGenre,
      url: mangaLink // Add URL for reference
    };
  } catch (error) {
    console.error(`Error processing manga ${manga.id}:`, error.message);
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
      console.log(`❌ No authors found for query: "${query}"`);
      return [];
    }
    
    console.log(`✅ Found ${authorData.data.length} authors matching "${query}"`);
    
    // Get the first author
    const author = authorData.data[0];
    const authorId = author.id;
    const authorName = author.attributes?.name || query;
    
    console.log(`✅ Using author: ${authorName} (ID: ${authorId})`);
    
    // Get manga IDs from author relationships
    const mangaIds = [];
    if (author.relationships) {
      author.relationships.forEach(rel => {
        if (rel.type === 'manga' && rel.id) {
          mangaIds.push(rel.id);
        }
      });
    }
    
    if (mangaIds.length === 0) {
      console.log(`❌ Author ${authorName} has no manga relationships`);
      
      // Try alternative approach: search manga directly
      const searchUrl = `https://api.mangadex.org/manga?limit=${limit}&title=${encodeURIComponent(query)}&order[followedCount]=desc&includes[]=cover_art`;
      console.log(`🔍 Trying alternative search: ${searchUrl}`);
      
      const searchData = await fetchJson(searchUrl);
      
      if (!searchData.data || searchData.data.length === 0) {
        console.log(`❌ No manga found by title search for "${query}"`);
        return [];
      }
      
      const results = [];
      for (const manga of searchData.data.slice(0, limit)) {
        const result = await processMangaWithCover(manga, null);
        if (result) {
          // Override authors with the searched author name
          result.authors = [authorName];
          results.push(result);
        }
      }
      
      return results;
    }
    
    // Fetch manga details for the found IDs
    const mangaUrl = `https://api.mangadex.org/manga?limit=${limit}&ids[]=${mangaIds.slice(0, 10).join('&ids[]=')}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&order[followedCount]=desc&includes[]=cover_art`;
    
    console.log(`🔍 MangaDex Author Manga URL: ${mangaUrl}`);
    
    const mangaData = await fetchJson(mangaUrl);
    
    if (!mangaData.data || mangaData.data.length === 0) {
      console.log(`❌ No manga found for author ${authorName}`);
      return [];
    }
    
    console.log(`✅ Found ${mangaData.data.length} manga for author ${authorName}`);
    
    const results = [];
    for (const manga of mangaData.data.slice(0, limit)) {
      const result = await processMangaWithCover(manga, null);
      if (result) {
        // Use the author name we found
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

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};