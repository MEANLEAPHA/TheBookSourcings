const { fetchJson } = require('../../../util/apiClient');

async function getOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/daily.json";
  const data = await fetchJson(url);

  if (!data || !data.works) return [];

  const books = await Promise.all(
    data.works.slice(0, 10).map(async (book) => {
      // Fetch work details for subjects
      const workData = await fetchJson(`https://openlibrary.org${book.key}.json`);

      // Fetch author names
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
        categories: workData.subjects || [],
      };
    })
  );

  return books;
}

module.exports = {
  getOpenLibraryTrending
};
