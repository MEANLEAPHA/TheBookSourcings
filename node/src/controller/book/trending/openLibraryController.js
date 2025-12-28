// Import fetchJson using require
const { fetchJson } = require('../../../util/apiClient');


// async function getOpenLibraryTrending() {
//   const url = "https://openlibrary.org/trending/daily.json";
//   const data = await fetchJson(url);

//   if (!data || !data.works) return [];

//   const books = await Promise.all(
//     data.works.map(async (book) => {
//       const workData = await fetchJson(`https://openlibrary.org${book.key}.json`);
//       return {
//         source: "Open Library",
//         title: book.title,
//         authors: book.author_name || [],
//         cover: book.cover_i
//           ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
//           : null,
//         bookId: book.key.replace("/works/", ""),
      
//       };
//     })
//   );

//   return books;
// }
async function getOpenLibraryTrending() {
  const url = "https://openlibrary.org/trending/daily.json";
  const data = await fetchJson(url);

  if (!data?.works) return [];

  return data.works.map(book => ({
    source: "openlibrary",
    bookId: book.key.replace("/works/", ""),
    title: book.title,
    authors: book.author_name || [],
    cover: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : null
  }));
}


// Export the function using CommonJS
module.exports = {
  getOpenLibraryTrending
};
