// const {fetchJson} = require('../../../../util/apiClient');

// // search good for author
// async function searchGutenbergByAuthor(query, limit = 20) {
//   if (!query) return [];

//   const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}`;

//   const res = await fetchJson(url);

//   return (res.data.results || []).slice(0, limit).map(book => ({
//     bookId: book.id,
//     title: book.title,
//     authors: book.authors.map(a => a.name),
//     cover: book.formats['image/jpeg'] || null,
//     source: 'gutenberg',
//     genre: book.subjects?.[0] || null
//   }));
// }

// async function searchGutenbergByGenre(query, limit = 20) {
//   if (!query) return [];

//   const url = `https://gutendex.com/books?topic=${encodeURIComponent(query)}&page=1`;

//   const res = await fetchJson(url);

//   return (res.data.results || []).slice(0, limit).map(book => ({
//     bookId: book.id,
//     title: book.title,
//     authors: book.authors.map(a => a.name),
//     cover: book.formats['image/jpeg'] || null,
//     source: 'gutenberg',
//     genre: book.subjects?.[0] || null
//   }));
// }


    


// module.exports = {
//   searchGutenbergByAuthor,
//   searchGutenbergByGenre
// };

const { fetchJson } = require('../../../../util/apiClient');

async function searchGutenbergByAuthor(query) {
  try {
    if (!query) return [];

    const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}&page=1`;

    console.log(`🔍 Gutenberg URL: ${url}`);
    
    const data = await fetchJson(url);
    
    return (data.results || []).map(book => ({
      bookId: book.id.toString(),
      title: book.title,
      authors: book.authors?.map(a => a.name) || [],
      cover: book.formats?.['image/jpeg'] || 
             book.formats?.['image/jpg'] || 
             book.formats?.['image/png'] || null,
      source: 'gutenberg',
      genre: book.subjects?.[0] || null
    }));
  } catch (error) {
    console.error('Gutenberg author search error:', error.message);
    return [];
  }
}

async function searchGutenbergByGenre(query) {
  try {
    if (!query) return [];

    const url = `https://gutendex.com/books?topic=${encodeURIComponent(query)}&page=1`;

    console.log(`🔍 Gutenberg Genre URL: ${url}`);
    
    const data = await fetchJson(url);
    
    return (data.results || []).map(book => ({
      bookId: book.id.toString(),
      title: book.title,
      authors: book.authors?.map(a => a.name) || [],
      cover: book.formats?.['image/jpeg'] || 
             book.formats?.['image/jpg'] || 
             book.formats?.['image/png'] || null,
      source: 'gutenberg',
      genre: book.subjects?.[0] || query
    }));
  } catch (error) {
    console.error('Gutenberg genre search error:', error.message);
    return [];
  }
}

module.exports = {
  searchGutenbergByAuthor,
  searchGutenbergByGenre
};