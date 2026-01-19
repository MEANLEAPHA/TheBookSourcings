const { fetchJson } = require('../../../../util/apiClient');

// Internet Archive API functions
async function searchInternetArchiveByAuthor(authorName, limit = 20) {
  try {
    if (!authorName) return [];
    
    // Clean up author name for search
    const searchAuthor = authorName.trim();
    
    // Internet Archive search API
    const url = `https://archive.org/advancedsearch.php?q=creator:"${encodeURIComponent(searchAuthor)}"+AND+mediatype:texts&fl[]=identifier,title,creator,year,subject&sort[]=&sort[]=&sort[]=&rows=${limit}&page=1&output=json`;
    
    console.log(`📚 Internet Archive Author URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data || !data.response || !data.response.docs) {
      console.log(`⚠️ Internet Archive: No results for author "${authorName}"`);
      return [];
    }
    
    return data.response.docs.map(item => ({
      bookId: item.identifier,
      title: item.title || 'Unknown Title',
      authors: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
      cover: `https://archive.org/services/img/${item.identifier}`,
      source: 'internet_archive',
      genre: item.subject?.[0] || null,
      year: item.year || null
    }));
    
  } catch (error) {
    console.log(`⚠️ Internet Archive author search error for "${authorName}":`, error.message);
    return [];
  }
}

async function searchInternetArchiveByGenre(genre, limit = 20) {
  try {
    if (!genre) return [];
    
    // Clean up genre for search
    const searchGenre = genre.trim().toLowerCase();
    
    // Internet Archive search by subject
    const url = `https://archive.org/advancedsearch.php?q=subject:"${encodeURIComponent(searchGenre)}"+AND+mediatype:texts&fl[]=identifier,title,creator,year,subject&sort[]=&sort[]=&sort[]=&rows=${limit}&page=1&output=json`;
    
    console.log(`📚 Internet Archive Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data || !data.response || !data.response.docs) {
      console.log(`⚠️ Internet Archive: No results for genre "${genre}"`);
      return [];
    }
    
    return data.response.docs.map(item => ({
      bookId: item.identifier,
      title: item.title || 'Unknown Title',
      authors: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
      cover: `https://archive.org/services/img/${item.identifier}`,
      source: 'internet_archive',
      genre: item.subject?.[0] || genre,
      year: item.year || null
    }));
    
  } catch (error) {
    console.log(`⚠️ Internet Archive genre search error for "${genre}":`, error.message);
    return [];
  }
}

// Alternative: Using the scrape API (sometimes more reliable)
async function searchInternetArchiveByAuthorScrape(authorName, limit = 20) {
  try {
    if (!authorName) return [];
    
    const url = `https://archive.org/services/search/v1/scrape?fields=identifier,title,creator,year,subject&q=creator:"${encodeURIComponent(authorName)}" AND mediatype:texts&count=${limit}`;
    
    console.log(`📚 Internet Archive Scrape URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data || !data.items) {
      console.log(`⚠️ Internet Archive Scrape: No results for author "${authorName}"`);
      return [];
    }
    
    return data.items.map(item => ({
      bookId: item.identifier,
      title: item.title || 'Unknown Title',
      authors: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
      cover: `https://archive.org/services/img/${item.identifier}`,
      source: 'internet_archive',
      genre: item.subject?.[0] || null,
      year: item.year || null
    }));
    
  } catch (error) {
    console.log(`⚠️ Internet Archive scrape error for "${authorName}":`, error.message);
    return [];
  }
}

async function searchInternetArchiveByGenreScrape(genre, limit = 20) {
  try {
    if (!genre) return [];
    
    const url = `https://archive.org/services/search/v1/scrape?fields=identifier,title,creator,year,subject&q=subject:"${encodeURIComponent(genre)}" AND mediatype:texts&count=${limit}`;
    
    console.log(`📚 Internet Archive Genre Scrape URL: ${url}`);
    
    const data = await fetchJson(url);
    
    if (!data || !data.items) {
      console.log(`⚠️ Internet Archive Scrape: No results for genre "${genre}"`);
      return [];
    }
    
    return data.items.map(item => ({
      bookId: item.identifier,
      title: item.title || 'Unknown Title',
      authors: Array.isArray(item.creator) ? item.creator : [item.creator || 'Unknown'],
      cover: `https://archive.org/services/img/${item.identifier}`,
      source: 'internet_archive',
      genre: item.subject?.[0] || genre,
      year: item.year || null
    }));
    
  } catch (error) {
    console.log(`⚠️ Internet Archive genre scrape error for "${genre}":`, error.message);
    return [];
  }
}

// Main exported functions (using the scrape API which is more reliable)
module.exports = {
  searchInternetArchiveByAuthor: searchInternetArchiveByAuthorScrape,
  searchInternetArchiveByGenre: searchInternetArchiveByGenreScrape,
  
  // Keep the original functions available if needed
  searchInternetArchiveByAuthorOriginal: searchInternetArchiveByAuthor,
  searchInternetArchiveByGenreOriginal: searchInternetArchiveByGenre,
  
  // Additional book sources you might want
  searchStandardEbooksByAuthor: async function(authorName, limit = 20) {
    // Your existing Standard Ebooks function
    try {
      const url = `https://raw.githubusercontent.com/standardebooks/web/master/catalog/data/ebooks.json`;
      const data = await fetchJson(url);
      
      const filtered = Object.values(data)
        .filter(ebook => 
          ebook.authors?.some(author => 
            author.name.toLowerCase().includes(authorName.toLowerCase())
          )
        )
        .slice(0, limit);
      
      return filtered.map(ebook => ({
        bookId: ebook.url,
        title: ebook.title,
        authors: ebook.authors.map(a => a.name),
        cover: `https://standardebooks.org${ebook.cover}`,
        source: 'standard_ebooks',
        genre: ebook.subjects?.[0] || null
      }));
    } catch (error) {
      console.log(`⚠️ Standard Ebooks error:`, error.message);
      return [];
    }
  },
  
  searchWikipediaBooksByAuthor: async function(authorName, limit = 20) {
    // Your existing Wikipedia function
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(authorName)}&format=json`;
      const searchData = await fetchJson(searchUrl);
      
      if (!searchData.query?.search?.[0]) return [];
      
      const pageId = searchData.query.search[0].pageid;
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&pageids=${pageId}&format=json`;
      
      const pageData = await fetchJson(pageUrl);
      const content = pageData.query?.pages?.[pageId]?.revisions?.[0]?.['*'] || '';
      
      const bookMatches = content.match(/\*\s*''([^'']+)''/g) || [];
      const books = bookMatches
        .map(match => match.replace(/\*\s*''([^'']+)''/, '$1'))
        .slice(0, limit);
      
      return books.map((title, index) => ({
        bookId: `wiki_${pageId}_${index}`,
        title: title,
        authors: [authorName],
        cover: null,
        source: 'wikipedia',
        genre: null
      }));
    } catch (error) {
      console.log(`⚠️ Wikipedia error:`, error.message);
      return [];
    }
  }
};

module.exports = {
  searchInternetArchiveByAuthor,
  searchInternetArchiveByGenre 
}