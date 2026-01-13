const db = require('../config/db');




async function getTopGenresForUser(memberQid, limit = 15) {
  const [rows] = await db.query(`
    SELECT 
      g.genre_id,
      g.name,
      g.slug,
      COUNT(*) AS score
    FROM user_book_activity uba
    JOIN genres g ON g.genre_id = uba.genre_id
    WHERE uba.memberQid = ?
    GROUP BY g.genre_id
    ORDER BY score DESC
    LIMIT ?
  `, [memberQid, limit]);

  return rows;
}


async function getTopAuthorIds(memberQid, limit = 10) {
  const [rows] = await db.query(`
    SELECT 
      author_id,
      COUNT(*) AS score
    FROM user_book_activity
    WHERE memberQid = ?
    GROUP BY author_id
    ORDER BY score DESC
    LIMIT ?
  `, [memberQid, limit]);

  return rows;
};

async function resolveAuthorNames(authorRows) {
  if (authorRows.length === 0) return [];

  const ottAuthors = authorRows
    .filter(
      a => a.author_id?.startsWith('OTTM')
    )
    .map(a => a.author_id);

  const extAuthors = authorRows
    .filter(a => !a.author_id?.startsWith('OTT'))
    .map(a => a.author_id);

  let ottMap = {};
  let extMap = {};

  // 🔹 OTT → users table
  if (ottAuthors.length) {
    const [rows] = await db.query(`
      SELECT authorQid, username
      FROM users
      WHERE authorQid IN (?)
    `, [ottAuthors]);

    rows.forEach(r => ottMap[r.authorQid] = r.username);
  }

  // 🔹 Google / Gutenberg / OpenLibrary → authors table
  if (extAuthors.length) {
    const [rows] = await db.query(`
      SELECT author_id, name
      FROM authors
      WHERE author_id IN (?)
    `, [extAuthors]);

    rows.forEach(r => extMap[r.author_id] = r.name);
  }

  // 🔹 Merge back
  return authorRows.map(a => ({
    author_id: a.author_id,
    name: a.author_id?.startsWith('OTTM')
      ? ottMap[a.author_id] || 'Unknown Author'
      : extMap[a.author_id] || 'Unknown Author',
    score: a.totalScore
  }));
}
async function getTopAuthorsForUser(memberQid, limit = 10) {
  const raw = await getTopAuthorIds(memberQid, limit);
  return resolveAuthorNames(raw);
}


module.exports = {
  getTopGenresForUser,
  getTopAuthorsForUser
};

