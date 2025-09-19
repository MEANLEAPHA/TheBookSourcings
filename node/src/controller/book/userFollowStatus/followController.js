const db = require("../../../config/db");

// Get book details + user status
const getFollowDetailsWithStatus = async (req, res) => {
  try {
    const { memberQid } = req.params;
    const userId = req.user.user_id;

    // Book info
    const [bookRows] = await db.query(
      "SELECT bookQid, title, author, likeCount, favoriteCount FROM uploadBook WHERE bookQid = ?",
      [bookId]
    );

    if (bookRows.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    const book = bookRows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT liked, favorited FROM user_book_status WHERE user_id = ? AND bookQid = ?",
      [userId, bookId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { liked: 0, favorited: 0 };

    res.json({
      book,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getBookDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle follow
const toggleFollow = async (req, res) => {
  try {
    const { member } = req.params;
    const userId = req.user.user_id;

    // Check current status
    const [rows] = await db.query(
      "SELECT liked FROM user_book_status WHERE user_id = ? AND bookQid = ?",
      [userId, bookId]
    );

    let liked = 0;

    if (rows.length > 0) {
      liked = rows[0].liked ? 0 : 1;
      await db.query(
        "UPDATE user_book_status SET liked = ?, updated_at = NOW() WHERE user_id = ? AND bookQid = ?",
        [liked, userId, bookId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO user_book_status (user_id, bookQid, liked) VALUES (?, ?, 1)",
        [userId, bookId]
      );
    }

    // Update uploadBook count
    await db.query(
      "UPDATE uploadBook SET likeCount = (SELECT COUNT(*) FROM user_book_status WHERE bookQid = ? AND liked = 1) WHERE bookQid = ?",
      [bookId, bookId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
getFollowDetailsWithStatus,
toggleFollow
};