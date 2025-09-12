// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');

// Define the async function
async function getOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/daily.json";
  const data = await fetchJson(url);

  if (!data || !data.works) return [];

  // Fetch extra details for each work
  const books = await Promise.all(
    data.works.slice(0, 10).map(async (book) => {
      const workData = await fetchJson(`https://openlibrary.org${book.key}.json`);
      return {
        source: "Open Library",
        title: book.title,
        authors: book.author_name || [],
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : null,
        bookId: book.key.replace("/works/", ""),
        categories: workData.subjects || [], // ✅ subjects come from workData
      };
    })
  );

  return books;
}

// Export the function using CommonJS
module.exports = {
  getOpenLibraryTrending
};
