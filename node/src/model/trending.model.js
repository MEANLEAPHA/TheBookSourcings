const {getGoogleTrending} = require('../controller/book/trending/googleController');
const {getGutenbergTrending} = require('../controller/book/trending/gutenbergController');
const {getOpenLibraryTrending} = require('../controller/book/trending/openLibraryController');
const {getOtthorTrending} = require('../controller/book/trending/otthorController');
async function getTrendingBooks(limit = 100) {
  const results = await Promise.allSettled([
    getGoogleTrending(),
    getGutenbergTrending(),
    getOpenLibraryTrending(),
    getOtthorTrending()
  ]);

  const books = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // optional shuffle
  books.sort(() => Math.random() - 0.5);

  return books.slice(0, limit);
}

module.exports = { getTrendingBooks };
