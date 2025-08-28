// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');

async function getOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/daily.json";
  const data = await fetchJson(url);

  if (!data || !data.works) return [];

  // Map over the top 10 works
  const books = await Promise.all(
    data.works.slice(0, 10).map(async (book) => {
      // Fetch author names for this book
      const authorNames = await Promise.all(
        (book.authors || []).map(async (a) => {
          const authorData = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
          return authorData.name || "Unknown";
        })
      );

      return {
        source: "Open Library",
        title: book.title,
        authors: authorNames,
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        bookId: book.key.replace("/works/", ""),
        categories: book.subjects || [],
      };
    })
  );

  return books;
}

// Export the function using CommonJS
module.exports = {
  getOpenLibraryTrending
};
