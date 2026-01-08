const { getTrendingBooks } = require('./trending.model');

async function getRandomBooks(limit = 20) {
  const books = await getTrendingBooks(200);
  return books.sort(() => Math.random() - 0.5).slice(0, limit);
}

module.exports = { getRandomBooks };
