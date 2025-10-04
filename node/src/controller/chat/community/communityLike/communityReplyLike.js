const db = require("../../../../config/db");

// Get book details + user status
const getReplyDetailsWithStatus = async (req, res) => {
  try {
    const { replyId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT like_count FROM community_post_comment_reply WHERE reply_id = ?",
      [replyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }
    const reply= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT commentReplyLiked	 FROM community_post_comment_reply_like WHERE memberQid = ? AND reply_id = ?",
      [memberQid, replyId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { commentReplyLiked: 0 };

    res.json({
      reply,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getReplyDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleLike = async (req, res) => {
  try {
    const { replyId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT commentReplyLiked FROM community_post_comment_reply_like WHERE memberQid = ? AND reply_id = ?",
      [memberQid, replyId]
    );

    let liked = 0;
 
    if (rows.length > 0) {
      liked = rows[0].commentReplyLiked ? 0 : 1;
      await db.query(
        "UPDATE community_post_comment_reply_like SET commentReplyLiked = ?, updated_at = NOW() WHERE memberQid = ? AND reply_id = ?",
        [liked, memberQid, replyId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO community_post_comment_reply_like (memberQid, reply_id, commentReplyLiked) VALUES (?, ?, 1)",
        [memberQid, replyId]
      );
    }

    // Update community_post_comment_reply like_count
    await db.query(
      "UPDATE community_post_comment_reply SET like_count = (SELECT COUNT(*) FROM community_post_comment_reply_like WHERE reply_id = ? AND commentReplyLiked = 1) WHERE reply_id = ?",
      [replyId, replyId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
  getReplyDetailsWithStatus,
  toggleLike
};