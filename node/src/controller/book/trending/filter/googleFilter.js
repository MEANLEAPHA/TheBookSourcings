// const { fetchJson } = require('../../../../util/apiClient');

// async function searchGoogleBookByAuthor(query, limit = 20) {
//   if (!query) return [];

//   const url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(query)}&maxResults=${limit}`;

//   const res = await fetchJson(url);

//   return (res.data.items || []).map(item => ({
//     bookId: item.id,
//     title: item.volumeInfo.title,
//     authors: item.volumeInfo.authors || [],
//     cover: item.volumeInfo.imageLinks?.thumbnail || null,
//     source: 'google',
//     genre: item.volumeInfo.categories?.[0] || null
//   }));
// }

// async function searchGoogleBookByGenre(query, limit = 20) {
//   if (!query) return [];

//   const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(query)}&maxResults=${limit}`;

//   const res = await fetchJson(url);

//   return (res.data.items || []).map(item => ({
//     bookId: item.id,
//     title: item.volumeInfo.title,
//     authors: item.volumeInfo.authors || [],
//     cover: item.volumeInfo.imageLinks?.thumbnail || null,
//     source: 'google',
//     genre: item.volumeInfo.categories?.[0] || null
//   }));
// }
// module.exports = {
//   searchGoogleBookByAuthor,
//   searchGoogleBookByGenre
// };
const { fetchJson } = require('../../../../util/apiClient');

async function searchGoogleBookByAuthor(query, limit = 20) {
  try {
    if (!query) return [];

    const url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(query)}"&maxResults=${limit}`;
    
    const res = await fetchJson(url);
    
    // Check if res.data exists or if res is the data directly
    const data = res.data || res;
    
    return (data.items || []).map(item => ({
      bookId: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || [],
      cover: item.volumeInfo?.imageLinks?.thumbnail || null,
      source: 'google',
      genre: item.volumeInfo?.categories?.[0] || null
    }));
  } catch (error) {
    console.error('Google Books author search error:', error.message);
    return [];
  }
}

async function searchGoogleBookByGenre(query, limit = 20) {
  try {
    if (!query) return [];

    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:"${encodeURIComponent(query)}"&maxResults=${limit}`;

    const res = await fetchJson(url);
    const data = res.data || res;
    
    return (data.items || []).map(item => ({
      bookId: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || [],
      cover: item.volumeInfo?.imageLinks?.thumbnail || null,
      source: 'google',
      genre: item.volumeInfo?.categories?.[0] || query
    }));
  } catch (error) {
    console.error('Google Books genre search error:', error.message);
    return [];
  }
}

module.exports = {
  searchGoogleBookByAuthor,
  searchGoogleBookByGenre
};