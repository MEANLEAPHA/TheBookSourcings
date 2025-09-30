const db = require("../../../../config/db");

// Get book details + user status
const getCommentDetailsWithStatus = async (req, res) => {
  try {
    const { commentId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT like_count FROM community_post_comment WHERE comment_id = ?",
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const comment= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT liked FROM community_post_comment_like WHERE memberQid = ? AND comment_id = ?",
      [memberQid, commentId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { liked: 0 };


    res.json({
      comment,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getCommentDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT liked FROM community_post_comment_like WHERE memberQid = ? AND comment_id = ?",
      [memberQid, commentId]
    );

    let liked = 0;
 
    if (rows.length > 0) {
      liked = rows[0].liked ? 0 : 1;
      await db.query(
        "UPDATE community_post_comment_like SET liked = ?, updated_at = NOW() WHERE memberQid = ? AND comment_id = ?",
        [liked, memberQid, commentId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO community_post_comment_like (memberQid, message_id, liked) VALUES (?, ?, 1)",
        [memberQid,commentId]
      );
    }

    // Update community like_count
    await db.query(
      "UPDATE community_post_comment SET like_count = (SELECT COUNT(*) FROM community_post_comment_like WHERE comment_id = ? AND liked = 1) WHERE comment_id = ?",
      [commentId, commentId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleCommentLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  getCommentDetailsWithStatus,
  toggleCommentLike
};