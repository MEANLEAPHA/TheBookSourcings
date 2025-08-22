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
    description: "Trending book from Open Library",
    cover: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : null,
    key: book.key
  }));
}

// Export the function using CommonJS
module.exports = {
  getOpenLibraryTrending
};
