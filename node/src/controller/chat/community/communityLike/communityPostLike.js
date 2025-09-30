const db = require("../../../../config/db");

// Get book details + user status
const getPostDetailsWithStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT like_count FROM community WHERE message_id = ?",
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    const post= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT liked FROM community_post_like WHERE memberQid = ? AND message_id = ?",
      [memberQid, messageId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { liked: 0 };


    res.json({
      post,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getPostkDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleLike = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT liked FROM community_post_like WHERE memberQid = ? AND message_id = ?",
      [memberQid, messageId]
    );

    let liked = 0;
 
    if (rows.length > 0) {
      liked = rows[0].liked ? 0 : 1;
      await db.query(
        "UPDATE community_post_like SET liked = ?, updated_at = NOW() WHERE memberQid = ? AND message_id = ?",
        [liked, memberQid, messageId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO community_post_like (memberQid, message_id, liked) VALUES (?, ?, 1)",
        [memberQid, messageId]
      );
    }

    // Update community like_count
    await db.query(
      "UPDATE community SET like_count = (SELECT COUNT(*) FROM community_post_like WHERE message_id = ? AND liked = 1) WHERE message_id = ?",
      [messageId, messageId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  getPostDetailsWithStatus,
  toggleLike
};