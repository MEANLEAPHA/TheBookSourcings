const db = require("../../../config/db");

// Get book details + user status
const getFollowDetailsWithStatus = async (req, res) => {
  try {
    const { memberQid } = req.params;
    const userId = req.user.user_id;

    // Book info
    const [memberRows] = await db.query(
      "SELECT  followCount FROM users WHERE memberQid = ?",
      [memberQid]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: "memberQid not found" });
    }
    const member = memberRows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT followed FROM user_follow_status WHERE user_id = ? AND memberQid = ?",
      [userId, memberQid]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { followed: 0 };

    res.json({
      member,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getFollowDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle follow
const toggleFollow = async (req, res) => {
  try {
    const { memberQid } = req.params;
    const userId = req.user.user_id;

    // Check current status
    const [rows] = await db.query(
      "SELECT followed FROM user_follow_status WHERE user_id = ? AND memberQid = ?",
      [userId, memberQid]
    );

    let followed = 0;

    if (rows.length > 0) {
      followed = rows[0].followed ? 0 : 1;
      await db.query(
        "UPDATE user_follow_status SET followed = ?, updated_at = NOW() WHERE user_id = ? AND memberQid = ?",
        [followed, userId, memberQid]
      );
    } else {
      followed = 1;
      await db.query(
        "INSERT INTO user_follow_status (user_id, memberQid, followed) VALUES (?, ?, 1)",
        [userId, memberQid]
      );
    }

    // Update uploadBook count
    await db.query(
      "UPDATE users SET followCount = (SELECT COUNT(*) FROM user_follow_status WHERE memberQid = ? AND followed = 1) WHERE memberQid = ?",
      [memberQid, memberQid]
    );

    res.json({ followed });
  } catch (err) {
    console.error("Error in toggleFollow:", err);
    res.status(500).json({ message: "Server error" });
  }
};




module.exports = {
getFollowDetailsWithStatus,
toggleFollow
};