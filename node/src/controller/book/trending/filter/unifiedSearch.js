// controller/book/trending/filter/unifiedSearch.js
const { fetchWithRateLimit, fetchInternetArchive } = require('../../../../util/unifiedApiClient');
const db = require('../../../../config/db');

// Shared cache configuration
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_SIZE = 2000;
const cache = new Map();
const processedCache = new Map();

// Cache key generator
function generateCacheKey(api, type, query, limit = 5) {
  return `${api}:${type}:${query.toLowerCase().trim()}:${limit}`;
}

// Generic cache wrapper
async function withCache(cacheKey, fetchFunction, ttl = CACHE_TTL) {
  const cached = cache.get(cacheKey);
  const now = Date.now();
  
  if (cached && now < cached.expiry) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  
  cache.set(cacheKey, {
    data,
    expiry: now + ttl
  });
  
  if (cache.size > MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  return data;
}

// --- GUTENBERG ---
async function searchGutenberg({ query, type, limit = 5 }) {
  const cacheKey = generateCacheKey('gutenberg', type, query, limit);
  
  return withCache(cacheKey, async () => {
    const param = type === 'author' ? 'search' : 'topic';
    const url = `https://gutendex.com/books?${param}=${encodeURIComponent(query)}&page=1`;
    
    const data = await fetchWithRateLimit('gutenberg', url);
    
    return (data.results || []).slice(0, limit).map(book => ({
      bookId: book.id.toString(),
      title: book.title,
      authors: book.authors?.map(a => a.name) || [],
      cover: book.formats?.['image/jpeg'] || book.formats?.['image/jpg'] || null,
      source: 'gutenberg',
      genre: type === 'genre' ? query : (book.subjects?.[0] || null)
    }));
  });
}

// --- OPEN LIBRARY ---
async function searchOpenLibrary({ query, type, limit = 5 }) {
  const cacheKey = generateCacheKey('openlibrary', type, query, limit);
  
  return withCache(cacheKey, async () => {
    let url;
    if (type === 'author') {
      url = `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&limit=${limit}`;
    } else {
      url = `https://openlibrary.org/subjects/${encodeURIComponent(query.toLowerCase())}.json?limit=${limit}`;
    }
    
    const data = await fetchWithRateLimit('openlibrary', url);
    
    if (type === 'author') {
      return (data.docs || []).map(book => ({
        bookId: book.key || book.edition_key?.[0] || '',
        title: book.title,
        authors: book.author_name || [],
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : (book.cover_edition_key 
              ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`
              : null),
        source: 'openlibrary',
        genre: book.subject?.[0] || null
      }));
    } else {
      return (data.works || []).map(w => ({
        bookId: w.key?.replace("/works/", "") || w.key,
        title: w.title,
        authors: w.authors?.[0]?.name ? [w.authors[0].name] : [],
        cover: w.cover_id 
          ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
          : (w.cover_edition_key 
              ? `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`
              : null),
        source: 'openlibrary',
        genre: w.subject?.[0] || query
      }));
    }
  });
}

// --- INTERNET ARCHIVE (FIXED) ---
async function searchInternetArchive({ query, type, limit = 5 }) {
  const cacheKey = generateCacheKey('internetarchive', type, query, limit);
  
  return withCache(cacheKey, async () => {
    const field = type === 'author' ? 'creator' : 'subject';
    // Use scrape API - more reliable than advancedsearch.php
    const url = `https://archive.org/services/search/v1/scrape?fields=identifier,title,creator,year,subject&q=${field}:"${encodeURIComponent(query)}" AND mediatype:texts&count=${limit}`;
    
    const data = await fetchWithRateLimit('internetArchive', url);
    
    if (!data || !data.items) return [];
    
    return data.items.map(item => ({
      bookId: item.identifier,
      title: item.title || 'Unknown Title',
      authors: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
      cover: `https://archive.org/services/img/${item.identifier}`,
      source: 'internet_archive',
      genre: type === 'genre' ? query : (item.subject?.[0] || null),
      year: item.year || null
    }));
  });
}

// --- MANGADEX ---
async function searchMangaDex({ query, type, limit = 5 }) {
  const cacheKey = generateCacheKey('mangadex', type, query, limit);
  
  return withCache(cacheKey, async () => {
    if (type === 'author') {
      return searchMangaDexByAuthor(query, limit);
    } else {
      return searchMangaDexByGenre(query, limit);
    }
  });
}

async function searchMangaDexByGenre(query, limit) {
  const url = `https://api.mangadex.org/manga?limit=${limit}&title=${encodeURIComponent(query)}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
  
  const data = await fetchWithRateLimit('mangadex', url);
  if (!data.data) return [];
  
  const results = [];
  for (const manga of data.data) {
    const processed = await processMangaData(manga, query);
    if (processed) results.push(processed);
  }
  return results;
}

async function searchMangaDexByAuthor(query, limit) {
  // First search for author ID
  const authorUrl = `https://api.mangadex.org/author?limit=5&name=${encodeURIComponent(query)}`;
  const authorData = await fetchWithRateLimit('mangadex', authorUrl);
  
  if (!authorData.data || authorData.data.length === 0) {
    return searchMangaDexByGenre(query, limit); // Fallback
  }
  
  const authorId = authorData.data[0].id;
  const authorName = authorData.data[0].attributes?.name || query;
  
  // Then get manga by author
  const mangaUrl = `https://api.mangadex.org/manga?limit=${limit}&authors[]=${authorId}&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc&includes[]=cover_art&includes[]=author`;
  const mangaData = await fetchWithRateLimit('mangadex', mangaUrl);
  
  if (!mangaData.data) return [];
  
  const results = [];
  for (const manga of mangaData.data) {
    const processed = await processMangaData(manga, null);
    if (processed) {
      processed.authors = [authorName];
      results.push(processed);
    }
  }
  return results;
}

async function processMangaData(manga, query) {
  const mangaCacheKey = `mangadex:processed:${manga.id}`;
  
  return withCache(mangaCacheKey, async () => {
    let coverUrl = null;
    if (manga.relationships) {
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      if (coverRel?.attributes?.fileName) {
        coverUrl = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
      }
    }
    
    const authors = manga.relationships
      ?.filter(r => r.type === 'author')
      ?.map(r => r.attributes?.name)
      ?.filter(Boolean) || ['Unknown Author'];
    
    const title = manga.attributes?.title?.en || 
                 manga.attributes?.title?.['ja-ro'] || 
                 Object.values(manga.attributes?.title || {})[0] || 
                 'Unknown Title';
    
    let genre = query;
    if (manga.attributes?.tags) {
      const genreTags = manga.attributes.tags
        .filter(tag => tag.attributes.group === 'genre')
        .map(tag => tag.attributes.name.en)
        .filter(Boolean);
      if (genreTags.length > 0) genre = genreTags[0];
    }
    
    return {
      bookId: manga.id,
      title,
      cover: coverUrl ? `/api/proxy/mangadex-image?url=${encodeURIComponent(coverUrl)}&mangaId=${manga.id}` : null,
      authors,
      source: 'mangadex',
      genre,
      status: manga.attributes?.status || 'ongoing'
    };
  }, 1000 * 60 * 60); // 1 hour cache for processed manga
}

// --- OTTHOR (Internal DB) ---
async function searchOtthor({ query, type, limit = 5 }) {
  const cacheKey = generateCacheKey('otthor', type, query, limit);
  
  return withCache(cacheKey, async () => {
    let rows;
    
    if (type === 'author') {
      // Handle both authorId and author name
      if (query.startsWith('OTTM')) {
        [rows] = await db.query(
          `SELECT bookQid AS bookId, title, bookCover AS cover, author, 'otthor' AS source
           FROM uploadBook WHERE JSON_CONTAINS(authorId, ?) LIMIT ?`,
          [JSON.stringify(query), limit]
        );
      } else {
        [rows] = await db.query(
          `SELECT bookQid AS bookId, title, bookCover AS cover, author, 'otthor' AS source
           FROM uploadBook WHERE author = ? LIMIT ?`,
          [query, limit]
        );
      }
    } else {
      [rows] = await db.query(
        `SELECT bookQid AS bookId, title, bookCover AS cover, author, 'otthor' AS source
         FROM uploadBook WHERE genre = ? LIMIT ?`,
        [query, limit]
      );
    }
    
    return rows;
  }, 1000 * 60 * 5); // 5 minute cache for DB queries
}

// --- MAIN UNIFIED SEARCH FUNCTION ---
const API_HANDLERS = {
  gutenberg: searchGutenberg,
  openlibrary: searchOpenLibrary,
  internetarchive: searchInternetArchive,
  mangadex: searchMangaDex,
  otthor: searchOtthor
};

async function unifiedSearch({ query, type, limit = 5, apis = null }) {
  const apisToUse = apis || Object.keys(API_HANDLERS);
  
  const promises = apisToUse.map(apiName => {
    const handler = API_HANDLERS[apiName];
    return handler({ query, type, limit })
      .catch(error => {
        console.log(`⚠️ ${apiName} ${type} search error:`, error.message);
        return [];
      });
  });
  
  const results = await Promise.all(promises);
  return results.flat();
}

module.exports = {
  unifiedSearch,
  // Individual exports for backward compatibility
  searchGutenberg: (query, type, limit) => searchGutenberg({ query, type, limit }),
  searchOpenLibrary: (query, type, limit) => searchOpenLibrary({ query, type, limit }),
  searchInternetArchive: (query, type, limit) => searchInternetArchive({ query, type, limit }),
  searchMangaDex: (query, type, limit) => searchMangaDex({ query, type, limit }),
  searchOtthor: (query, type, limit) => searchOtthor({ query, type, limit })
};