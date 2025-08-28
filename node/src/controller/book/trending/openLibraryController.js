// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');

// Define the async function
async function getOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/daily.json";
  const data = await fetchJson(url);

  if (!data || !data.works) return [];

  return data.works.slice(0, 10).map(book => ({
    source: "Open Library",
    title: book.title,
    authors: book.authors?.map(a => a.name) || [],
    cover: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : null,
    bookId: book.key.replace("/works/", "")
  }));
}

// Export the function using CommonJS
module.exports = {
  getOpenLibraryTrending
};
