// const {getGoogleTrending} = require('../controller/book/trending/googleController');
const {getGutenbergTrending} = require('../controller/book/trending/gutenbergController');
const {getOpenLibraryTrending} = require('../controller/book/trending/openLibraryController');
const {getOtthorTrending} = require('../controller/book/trending/otthorController');
const { getMangaDexTrending } = require('../controller/book/trending/mangaDexController');
const {getInternetArchiveTrending} = require('../controller/book/trending/internetArchiveController');
async function getTrendingBooks(limit = 50) {
  const results = await Promise.allSettled([
    // getGoogleTrending(),
    getGutenbergTrending(),
    getOpenLibraryTrending(),
    getOtthorTrending(),
    getInternetArchiveTrending(),
    getMangaDexTrending()
  ]);

  const books = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // optional shuffle
  books.sort(() => Math.random() - 0.5);

  return books.slice(0, limit);
}

module.exports = { getTrendingBooks };
