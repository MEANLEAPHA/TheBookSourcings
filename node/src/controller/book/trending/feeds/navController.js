const db = require('../../../../config/db');
const {
  getTopGenresForUser,
  getTopAuthorsForUser
} = require('../../../../model/nav.model');

async function getNavData(req, res) {
  try {
    const memberQid = req.user?.memberQid || null;

    // Logged user only (guest handled elsewhere)
    const [genres, authors] = await Promise.all([
      getTopGenresForUser(memberQid, 15),
      getTopAuthorsForUser(memberQid, 10)
    ]);

    res.json({
      success: true,
      genres,
      authors
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}

// fallback for guest or first-time user
async function getRandomGenres(limit = 15) {
  const [rows] = await db.query(`
    SELECT genre_id, name, slug
    FROM genres
    ORDER BY RAND()
    LIMIT ?
  `, [limit]);

  return rows;
}

async function getNav(req, res) {
  try {
    const memberQid = req.user?.memberQid || null;

    let genres = [];

    if (!memberQid) {
      // 👤 Guest
      genres = await getRandomGenres(15);
    } else {
      // 👤 Logged-in user
      const userGenres = await getTopGenresForUser(memberQid, 15);

      if (userGenres.length < 5) {
        // first time or low activity → fallback
        genres = await getRandomGenres(15);
      } else {
        genres = userGenres;
      }
    }

    res.json({
      success: true,
      genres
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}


module.exports = { getNavData, getNav };

