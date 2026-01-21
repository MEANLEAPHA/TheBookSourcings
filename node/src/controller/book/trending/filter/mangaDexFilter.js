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
      const result = await processManga(manga, query);
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
        const result = await processManga(manga, matchingGenre);
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

// Helper: Process a single manga
async function processManga(manga, genre) {
  try {
    // Get cover image - NEW CORRECT METHOD
    let cover = null;
    
    // Method 1: Check if cover_art is included in relationships
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        const fileName = coverRel.attributes.fileName;
        // CORRECT COVER URL FORMAT
        cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
        
        // You can optionally add size suffix, but the base URL should work
        // cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`;
      }
    }
    
    // Method 2: Fetch cover separately if not found in relationships
    if (!cover) {
      try {
        const coverUrl = `https://api.mangadex.org/cover?limit=1&manga[]=${manga.id}&order[createdAt]=desc`;
        const coverData = await fetchJson(coverUrl);
        if (coverData.data?.[0]?.attributes?.fileName) {
          const fileName = coverData.data[0].attributes.fileName;
          // CORRECT COVER URL FORMAT
          cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
        }
      } catch (coverError) {
        console.log(`⚠️ Could not fetch cover for manga ${manga.id}: ${coverError.message}`);
      }
    }
    
    // Method 3: Try with different size suffix if still no cover
    if (cover && !cover.includes('.jpg') && !cover.includes('.png')) {
      // Try with .jpg extension
      const jpgUrl = `${cover}.256.jpg`;
      // You could test this URL or just use it
      cover = jpgUrl;
    }
    
    // Get authors
    let authors = ["Unknown"];
    if (manga.relationships) {
      const authorIds = manga.relationships
        .filter(r => r.type === 'author')
        .map(r => r.id)
        .filter(id => id);
      
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
    
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
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
    
    return {
      bookId: manga.id,
      title: title,
      cover: cover,
      authors: authors.length > 0 ? authors : ["Unknown"],
      source: "mangadex",
      genre: actualGenre
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
      
      // Try alternative approach: search manga directly by author
      const searchUrl = `https://api.mangadex.org/manga?limit=${limit}&title=${encodeURIComponent(query)}&order[followedCount]=desc&includes[]=cover_art`;
      console.log(`🔍 Trying alternative search: ${searchUrl}`);
      
      const searchData = await fetchJson(searchUrl);
      
      if (!searchData.data || searchData.data.length === 0) {
        console.log(`❌ No manga found by title search for "${query}"`);
        return [];
      }
      
      return await processMangaList(searchData.data.slice(0, limit), authorName, 'mangadex');
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
    
    return await processMangaList(mangaData.data.slice(0, limit), authorName, 'mangadex');
  } catch (error) {
    console.error('❌ MangaDex author search error:', error.message);
    return [];
  }
}

// Helper function to process manga list
async function processMangaList(mangaList, authorName, source) {
  const results = [];
  
  for (const manga of mangaList) {
    // Get cover image - SIMPLIFIED VERSION
    let cover = null;
    
    // Check relationships for cover_art
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        const fileName = coverRel.attributes.fileName;
        // Use the simplified URL format
        cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
      }
    }
    
    // If no cover found, try to fetch it
    if (!cover) {
      try {
        const result = await processManga(manga, null);
        if (result && result.cover) {
          cover = result.cover;
        }
      } catch (error) {
        console.log(`⚠️ Could not get cover for ${manga.id}:`, error.message);
      }
    }
    
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    // Get genres from tags
    const genres = manga.attributes?.tags
      ?.filter(tag => tag.attributes.group === 'genre')
      ?.map(tag => tag.attributes.name.en)
      ?.filter(name => name) || [];
    
    results.push({
      bookId: manga.id,
      title: title,
      cover: cover,
      authors: [authorName],
      source: source,
      genre: genres[0] || null
    });
  }
  
  return results;
}
// Debug function to test cover URLs
// async function testCoverUrl(mangaId) {
//   try {
//     const coverUrl = `https://api.mangadex.org/cover?limit=1&manga[]=${mangaId}`;
//     const coverData = await fetchJson(coverUrl);
    
//     if (coverData.data?.[0]) {
//       const cover = coverData.data[0];
//       console.log('Cover data:', cover);
//       console.log('File name:', cover.attributes.fileName);
//       console.log('URL 1:', `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}`);
//       console.log('URL 2:', `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}.256.jpg`);
//       console.log('URL 3:', `https://uploads.mangadex.org/covers/${mangaId}/${cover.attributes.fileName}.512.jpg`);
//     }
//   } catch (error) {
//     console.error('Test error:', error.message);
//   }
// }

module.exports = {
  searchByMangaDexGenre,
  searchByMangaDexAuthor
};