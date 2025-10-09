const db = require("../../../../config/db");

// Get book details + user status
const getPostDetailsWithStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT favorite_count FROM community WHERE message_id = ?",
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    const post= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT favorited FROM community_post_favorited WHERE memberQid = ? AND message_id = ?",
      [memberQid, messageId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { favorited: 0 };


    res.json({
      post,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getPostDetailsWithFavStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleFav = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT favorited FROM community_post_favorited WHERE memberQid = ? AND message_id = ?",
      [memberQid, messageId]
    );

    let favorited = 0;
 
    if (rows.length > 0) {
      favorited  = rows[0].favorited ? 0 : 1;
      await db.query(
        "UPDATE community_post_favorited SET favorited = ?, updated_at = NOW() WHERE memberQid = ? AND message_id = ?",
        [favorited, memberQid, messageId]
      );
    } else {
      favorited = 1;
      await db.query(
        "INSERT INTO community_post_favorited (memberQid, message_id, favorited) VALUES (?, ?, 1)",
        [memberQid, messageId]
      );
    }

    // Update community like_count
    await db.query(
      "UPDATE community SET favorite_count = (SELECT COUNT(*) FROM community_post_favorited WHERE message_id = ? AND favorited = 1) WHERE message_id = ?",
      [messageId, messageId]
    );

    res.json({ favorited });
  } catch (err) {
    console.error("Error in toggleFav:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  getPostDetailsWithStatus,
  toggleFav
};