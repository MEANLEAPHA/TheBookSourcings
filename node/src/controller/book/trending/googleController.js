const { fetchJson } = require('../../../util/apiClient');

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY";

async function getGoogleTrending() {
  const url = `https://www.googleapis.com/books/v1/volumes?q=trending&maxResults=10&key=AIzaSyA4pGs-ia5mfEL6EoJEWPIL-o6KComj0xY`;
  const data = await fetchJson(url);

  if (!data || !data.items) return [];

  return data.items.map(book => ({
    source: "Google Books",
    title: book.volumeInfo.title,
    authors: book.volumeInfo.authors || [],
    description: book.volumeInfo.description || "No description available",
    cover: book.volumeInfo.imageLinks?.thumbnail || null,
    publishedDate: book.volumeInfo.publishedDate,
    categories: book.volumeInfo.categories || []
  }));
}

module.exports = { getGoogleTrending };
