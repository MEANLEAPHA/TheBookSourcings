// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');

// Define the async function
async function getGutenbergTrending() {
  const url = "https://gutendex.com/books?sort=popular";
  const data = await fetchJson(url);

  if (!data || !data.results) return [];

  return data.results.slice(0, 10).map(book => ({
    source: "Project Gutenberg",
    title: book.title,
    authors: book.authors.map(a => a.name),
    description: "Classic book from Project Gutenberg",
    cover: book.formats["image/jpeg"] || null,
    subjects: book.subjects || []
  }));
}

// Export the function using CommonJS
module.exports = {
  getGutenbergTrending
};
