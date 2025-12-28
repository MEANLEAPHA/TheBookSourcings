// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');

// Define the async function
async function getGutenbergTrending() {
  const url = "https://gutendex.com/books?sort=popular";
  const data = await fetchJson(url);

  if (!data || !data.results) return [];

  return data.results.map(book => {
    // Clean author names (convert "Last, First" → "First Last")
    const authors = (book.authors || []).map(a => {
      if (a.name.includes(",")) {
        const [last, first] = a.name.split(",").map(s => s.trim());
        return first && last ? `${first} ${last}` : a.name;
      }
      return a.name;
    });

    return {
      source: "Project Gutenberg",
      title: book.title,
      authors,
      cover: book.formats["image/jpeg"] || null,
      // categories: book.subjects || [],
      bookId: book.id
    };
  });
}

// Export the function using CommonJS
module.exports = {
  getGutenbergTrending
};
