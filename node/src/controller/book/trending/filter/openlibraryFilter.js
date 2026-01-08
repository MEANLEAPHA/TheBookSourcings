const {fetchJson} = require('../../../../util/apiClient');

async function searchOpenLibraryByGenre(query, limit = 20) {
  if (!query) return [];

  const url = `https://openlibrary.org/subjects/${encodeURIComponent(query)}.json`;

  const res = await fetchJson(url);

  if (res?.works) {
        res.works.slice(0, limit).map((w) => {
          let cover = null;
          if (w.cover_id) {
            cover = `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`;
          } else if (w.cover_edition_key) {
            cover = `https://covers.openlibrary.org/b/olid/${w.cover_edition_key}-L.jpg`;
          }

          return {
            title: w.title,
            bookId: w.key.replace("/works/", ""),
            cover,
            authors: w.authors?.[0]?.name || "Unknown",
            source: "Open Library",
             genre: w.subject?.[0] || null
          };
        })
    }
    
  return [];

}
async function searchOpenLibraryByAuthor(query, limit = 20) {
  if (!query) return [];

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`;

  const res = await fetchJson(url);

  return (res.data.docs || []).slice(0, limit).map(book => ({
    bookId: book.key,
    title: book.title,
    authors: book.author_name || [],
    cover: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg`,
    source: 'openlibrary',
    genre: book.subject?.[0] || null
  }));
}

module.exports = {
  searchOpenLibraryByGenre,
  searchOpenLibraryByAuthor
};
