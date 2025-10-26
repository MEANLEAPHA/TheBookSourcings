const db = require("../../../config/db");
const { ensureChatRoom } = require("../../shop/orderController");
// ===============================
// 1️⃣ Get user details + follow status
// ===============================
const getFollowDetailsWithStatus = async (req, res) => {
  try {
    const { followedQid } = req.params;
    const followerQid = req.user.memberQid;

    const [memberRows] = await db.query(
      "SELECT followingCount, followerCount FROM users WHERE memberQid = ?",
      [followedQid]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ message: "followedQid not found" });
    }

    const member = memberRows[0];

    const [statusRows] = await db.query(
      "SELECT followed, is_mutual FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
      [followerQid, followedQid]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { followed: 0, is_mutual: 0 };

    res.json({ member, userStatus: status });

  } catch (err) {
    console.error("Error in getFollowDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleFollowLogic = async (followerQid, followedQid) => {
  if (followerQid === followedQid) {
    throw new Error("You cannot follow yourself");
  }

  // Check if record exists
  const [rows] = await db.query(
    "SELECT followed, notified FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
    [followerQid, followedQid]
  );

  let followed;

  if (rows.length > 0) {
    // Toggle follow
    followed = rows[0].followed ? 0 : 1;

    await db.query(
      "UPDATE user_follow_status SET followed = ?, updated_at = NOW() WHERE followerQid = ? AND followedQid = ?",
      [followed, followerQid, followedQid]
    );

    if (followed === 0) {
      // 🧩 Unfollow: clear mutual + notified
      await db.query(
        "UPDATE user_follow_status SET is_mutual = 0, notified = 0 WHERE (followerQid = ? AND followedQid = ?) OR (followerQid = ? AND followedQid = ?)",
        [followerQid, followedQid, followedQid, followerQid]
      );

      // 🧩 Delete the old follow notification
      await db.query(
        "DELETE FROM notifications WHERE senderQid = ? AND receiverQid = ? AND type = 'follow'",
        [followerQid, followedQid]
      );
       await db.query(
        `UPDATE chatRooms 
        SET soft_delete_by = ? 
        WHERE ((buyerQid = ? AND sellerQid = ?) OR (buyerQid = ? AND sellerQid = ?))
          AND type = 'friend' AND soft_delete_by IS NULL`,
        [followerQid, followerQid, followedQid, followedQid, followerQid]
      );

      // Check if both already unfollowed (mutual 0)
      const [bothUnfollow] = await db.query(
        `SELECT * FROM user_follow_status 
        WHERE ((followerQid = ? AND followedQid = ?) OR (followerQid = ? AND followedQid = ?))
          AND followed = 1`,
        [followerQid, followedQid, followedQid, followerQid]
      );

      if (bothUnfollow.length === 0) {
        // Both unfollowed → hard delete chat room
        await db.query(
          `DELETE FROM chatRooms 
          WHERE ((buyerQid = ? AND sellerQid = ?) OR (buyerQid = ? AND sellerQid = ?))
            AND type = 'friend'`,
          [followerQid, followedQid, followedQid, followerQid]
        );
  }
    } 
    else if (rows[0].notified === 0) {
      // 🧩 Re-follow: send notification again
      const [sender] = await db.query(
        "SELECT username FROM users WHERE memberQid = ?",
        [followerQid]
      );

      const senderName = sender.length > 0 ? sender[0].username : "Someone";

      await db.query(
        `INSERT INTO notifications (senderQid, receiverQid, type, message)
         VALUES (?, ?, 'follow', ?)`,
        [followerQid, followedQid, `👋 ${senderName} started following you!`]
      );

      await db.query(
        "UPDATE user_follow_status SET notified = 1 WHERE followerQid = ? AND followedQid = ?",
        [followerQid, followedQid]
      );
    }

  } else {
    // 🧩 First-time follow
    followed = 1;
    await db.query(
      "INSERT INTO user_follow_status (followerQid, followedQid, followed, notified) VALUES (?, ?, 1, 0)",
      [followerQid, followedQid]
    );

    const [sender] = await db.query(
      "SELECT username FROM users WHERE memberQid = ?",
      [followerQid]
    );

    const senderName = sender.length > 0 ? sender[0].username : "Someone";

    await db.query(
      `INSERT INTO notifications (senderQid, receiverQid, type, message)
       VALUES (?, ?, 'follow', ?)`,
      [followerQid, followedQid, `👋 ${senderName} started following you!`]
    );

    await db.query(
      "UPDATE user_follow_status SET notified = 1 WHERE followerQid = ? AND followedQid = ?",
      [followerQid, followedQid]
    );
  }

  // 🧩 Update follower/following counts
  await db.query(
    "UPDATE users SET followingCount = GREATEST(followingCount + ?, 0) WHERE memberQid = ?",
    [followed ? 1 : -1, followerQid]
  );
  await db.query(
    "UPDATE users SET followerCount = GREATEST(followerCount + ?, 0) WHERE memberQid = ?",
    [followed ? 1 : -1, followedQid]
  );

  // 🧩 Mutual check
  let is_mutual = 0;
  if (followed) {
    const [mutualCheck] = await db.query(
      "SELECT followed FROM user_follow_status WHERE followerQid = ? AND followedQid = ? AND followed = 1",
      [followedQid, followerQid]
    );

    if (mutualCheck.length > 0) {
      await db.query(
        `UPDATE user_follow_status 
         SET is_mutual = 1 
         WHERE (followerQid = ? AND followedQid = ?) 
            OR (followerQid = ? AND followedQid = ?)`,

        [followerQid, followedQid, followedQid, followerQid]
      );
      is_mutual = 1;
      try {
        await ensureChatRoom(followerQid, followedQid, "friend");
      } catch (err) {
        console.error("Failed to create friend chat room:", err);
      }
    }
  }

  return { followed, is_mutual };
};

// ===========================
// 🚀 toggleFollow Controller
// ===========================
const toggleFollow = async (req, res) => {
  try {
    const followerQid = req.user.memberQid;
    const { followedQid } = req.params;
    const result = await toggleFollowLogic(followerQid, followedQid);
    res.json({ ...result, message: result.followed ? "Followed" : "Unfollowed" });
  } catch (err) {
    console.error("Error in toggleFollow:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// ===========================
// 🚀 followBackController
// ===========================
const followBackController = async (req, res) => {
  try {
    // 🧠 The logged-in user is the one doing the follow-back
    const followedQid = req.user.memberQid;

    // 🧠 The one who originally followed me
    const { followerQid } = req.params;

    if (!followerQid || !followedQid) {
      return res.status(400).json({ message: "Missing follower or followed QID" });
    }

    // 🧩 Call your logic — make sure the first param = follower, second = followed
    const result = await toggleFollowLogic(followedQid, followerQid);

    // ✅ If it's now mutual, send a notification
    if (result?.is_mutual) {
      await db.query(
        `INSERT INTO notifications (senderQid, receiverQid, type, message)
         VALUES (?, ?, 'follow', ?)`,
        [
          followedQid,
          followerQid,
          `🎉 ${req.user.username} followed you back. Start chatting and become closed firend`,
        ]
      );
    }

    res.json({
      message: "Follow back completed",
      mutual: result?.is_mutual || false,
    });
  } catch (err) {
    console.error("Error in followBackController:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};


const getFollowing = async (req, res) => {
  try {
    const userQid = req.user.memberQid;

    const [rows] = await db.query(
      `SELECT u.memberQid, u.username, u.nickname, ufs.is_mutual
       FROM user_follow_status ufs
       JOIN users u ON u.memberQid = ufs.followedQid
       WHERE ufs.followerQid = ? AND ufs.followed = 1`,
      [userQid]
    );

    res.json({ following: rows });
  } catch (err) {
    console.error("Error in getFollowing:", err);
    res.status(500).json({ message: "Server error" });
  }
};
 const getFollowers = async (req, res) => {
  try {
    const userQid = req.user.memberQid;

    const [rows] = await db.query(
      `SELECT u.memberQid, u.username, u.nickname, ufs.is_mutual
       FROM user_follow_status ufs
       JOIN users u ON u.memberQid = ufs.followerQid
       WHERE ufs.followedQid = ? AND ufs.followed = 1`,
      [userQid]
    );

    res.json({ followers: rows });
  } catch (err) {
    console.error("Error in getFollowers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 4️⃣ Notification Controller (fetch list of pending follow backs)
// ===============================
const getFollowNotifications = async (req, res) => {
  try {
    const userQid = req.user.memberQid;

    const [rows] = await db.query(
      `SELECT ufs.followerQid, u.username AS followerName
       FROM user_follow_status ufs
       JOIN users u ON u.memberQid = ufs.followerQid
       WHERE ufs.followedQid = ? AND ufs.followed = 1 AND ufs.is_mutual = 0`,
      [userQid]
    );

    res.json({ pendingFollowBacks: rows });

  } catch (err) {
    console.error("Error in getFollowNotifications:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getFollowDetailsWithStatus,
  toggleFollow,
  followBackController,
  getFollowNotifications,
  getFollowing,
  getFollowers
};
