const {fetchJson} = require('../../../../util/apiClient');

// search good for author
async function searchGutenbergByAuthor(query, limit = 20) {
  if (!query) return [];

  const url = `https://gutendex.com/books?search=${encodeURIComponent(query)}`;

  const res = await fetchJson(url);

  return (res.data.results || []).slice(0, limit).map(book => ({
    bookId: book.id,
    title: book.title,
    authors: book.authors.map(a => a.name),
    cover: book.formats['image/jpeg'] || null,
    source: 'gutenberg',
    genre: book.subjects?.[0] || null
  }));
}

async function searchGutenbergByGenre(query, limit = 20) {
  if (!query) return [];

  const url = `https://gutendex.com/books?topic=${encodeURIComponent(query)}&page=1`;

  const res = await fetchJson(url);

  return (res.data.results || []).slice(0, limit).map(book => ({
    bookId: book.id,
    title: book.title,
    authors: book.authors.map(a => a.name),
    cover: book.formats['image/jpeg'] || null,
    source: 'gutenberg',
    genre: book.subjects?.[0] || null
  }));
}


    


module.exports = {
  searchGutenbergByAuthor,
  searchGutenbergByGenre
};
