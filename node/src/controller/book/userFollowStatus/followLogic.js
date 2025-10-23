const db = require("../../../config/db");


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

const toggleFollow = async (req, res) => {
  try {
    const followerQid = req.user.memberQid;
    const { followedQid } = req.params;

    if (followerQid === followedQid) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check existing follow
    const [rows] = await db.query(
      "SELECT followed FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
      [followerQid, followedQid]
    );

    let followed;
    if (rows.length > 0) {
      // Toggle follow/unfollow
      followed = rows[0].followed ? 0 : 1;
      await db.query(
        "UPDATE user_follow_status SET followed = ?, updated_at = NOW() WHERE followerQid = ? AND followedQid = ?",
        [followed, followerQid, followedQid]
      );

      if (followed === 0) {
        // Unfollow → reset is_mutual and notified for both directions
        await db.query(
          "UPDATE user_follow_status SET is_mutual = 0, notified = 0 WHERE (followerQid = ? AND followedQid = ?) OR (followerQid = ? AND followedQid = ?)",
          [followerQid, followedQid, followedQid, followerQid]
        );
      }
    } else {
      // New follow
      followed = 1;
      await db.query(
        "INSERT INTO user_follow_status (followerQid, followedQid, followed, notified) VALUES (?, ?, 1, 0)",
        [followerQid, followedQid]
      );
    }

    // Update follower/following counts
    await db.query(
      "UPDATE users SET followingCount = GREATEST(followingCount + ?, 0) WHERE memberQid = ?",
      [followed ? 1 : -1, followerQid]
    );
    await db.query(
      "UPDATE users SET followerCount = GREATEST(followerCount + ?, 0) WHERE memberQid = ?",
      [followed ? 1 : -1, followedQid]
    );

    // Handle notification when following
    if (followed) {
      const [notifCheck] = await db.query(
        "SELECT notified FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
        [followerQid, followedQid]
      );
      if (notifCheck.length && notifCheck[0].notified === 0) {
        // Send notification or mark as notified
        await db.query(
          "UPDATE user_follow_status SET notified = 1 WHERE followerQid = ? AND followedQid = ?",
          [followerQid, followedQid]
        );
      }

      // Check for mutual follow
      const [mutualCheck] = await db.query(
        "SELECT followed FROM user_follow_status WHERE followerQid = ? AND followedQid = ? AND followed = 1",
        [followedQid, followerQid]
      );

      if (mutualCheck.length > 0) {
        // Mutual follow → set is_mutual for both
        await db.query(
          `UPDATE user_follow_status 
           SET is_mutual = 1 
           WHERE (followerQid = ? AND followedQid = ?) 
              OR (followerQid = ? AND followedQid = ?)`,
          [followerQid, followedQid, followedQid, followerQid]
        );
      }
    }

    // ✅ Get current is_mutual after all updates
    const [statusRows] = await db.query(
      "SELECT is_mutual FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
      [followerQid, followedQid]
    );
    const is_mutual = statusRows.length > 0 ? statusRows[0].is_mutual : 0;

    res.json({ followed, is_mutual, message: followed ? "Followed" : "Unfollowed" });

  } catch (err) {
    console.error("Error in toggleFollow:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// const toggleFollow = async (req, res) => {
//   try {
//     const followerQid = req.user.memberQid;
//     const { followedQid } = req.params;

//     if (followerQid === followedQid) {
//       return res.status(400).json({ message: "You cannot follow yourself" });
//     }

//     // Check existing follow
//     const [rows] = await db.query(
//       "SELECT followed FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
//       [followerQid, followedQid]
//     );

//     let followed;
//     if (rows.length > 0) {
//       // Toggle follow/unfollow
//       followed = rows[0].followed ? 0 : 1;
//       await db.query(
//         "UPDATE user_follow_status SET followed = ?, updated_at = NOW() WHERE followerQid = ? AND followedQid = ?",
//         [followed, followerQid, followedQid]
//       );

//       if (followed === 0) {
//         // Unfollow → reset is_mutual for both directions
//         await db.query(
//           "UPDATE user_follow_status SET is_mutual = 0 WHERE (followerQid = ? AND followedQid = ?) OR (followerQid = ? AND followedQid = ?)",
//           [followerQid, followedQid, followedQid, followerQid]
//         );
//       }
//     } else {
//       // New follow
//       followed = 1;
//       await db.query(
//         "INSERT INTO user_follow_status (followerQid, followedQid, followed, notified) VALUES (?, ?, 1, 0)",
//         [followerQid, followedQid]
//       );
//     }

//     // Update follower/following counts
//     await db.query(
//       "UPDATE users SET followingCount = GREATEST(followingCount + ?, 0) WHERE memberQid = ?",
//       [followed ? 1 : -1, followerQid]
//     );
//     await db.query(
//       "UPDATE users SET followerCount = GREATEST(followerCount + ?, 0) WHERE memberQid = ?",
//       [followed ? 1 : -1, followedQid]
//     );

//     // Handle notification
//     if (followed) {
//       const [notifCheck] = await db.query(
//         "SELECT notified FROM user_follow_status WHERE followerQid = ? AND followedQid = ?",
//         [followerQid, followedQid]
//       );
//       if (notifCheck.length && notifCheck[0].notified === 0) {
//         // TODO: Send notification to `followedQid`
//         await db.query(
//           "UPDATE user_follow_status SET notified = 1 WHERE followerQid = ? AND followedQid = ?",
//           [followerQid, followedQid]
//         );
//       }

//       // Check for mutual follow
//       const [mutualCheck] = await db.query(
//         "SELECT followed FROM user_follow_status WHERE followerQid = ? AND followedQid = ? AND followed = 1",
//         [followedQid, followerQid]
//       );

//       if (mutualCheck.length > 0) {
//         // Mutual follow → set is_mutual for both
//         await db.query(
//           `UPDATE user_follow_status 
//            SET is_mutual = 1 
//            WHERE (followerQid = ? AND followedQid = ?) 
//               OR (followerQid = ? AND followedQid = ?)`,
//           [followerQid, followedQid, followedQid, followerQid]
//         );

//         // Future chat room creation
//       // await db.query(
//       //   `INSERT IGNORE INTO chatRooms (user1Qid, user2Qid) VALUES (LEAST(?, ?), GREATEST(?, ?))`,
//       //   [followerQid, followedQid, followerQid, followedQid]
//       // );
//       }

//     }

//     res.json({ followed, message: followed ? "Followed" : "Unfollowed" });

//   } catch (err) {
//     console.error("Error in toggleFollow:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// ===============================
// 3️⃣ Follow Back Controller
// ===============================
const followBackController = async (req, res) => {
  try {
    const followerQid = req.user.memberQid;       // B - current user
    const { followerOfQid } = req.params;         // A - the follower

    // Set params to call toggleFollow
    req.params.followedQid = followerOfQid;
    const toggleResult = await toggleFollow(req, res); // returns { followed, is_mutual }

    // If mutual follow happened, create notifications
    if (toggleResult.is_mutual) {
      // Notify followerOfQid (A)
      await db.query(
        `INSERT INTO notifications (senderQid, receiverQid, type, message)
         VALUES (?, ?, 'follow', ?)`,
        [followerQid, followerOfQid, `🎉 ${req.user.username} followed you back. You are now friends!`]
      );

      // Optionally, notify current user (B)
      await db.query(
        `INSERT INTO notifications (senderQid, receiverQid, type, message)
         VALUES (?, ?, 'follow', ?)`,
        [followerOfQid, followerQid, `🎉 You and ${req.user.username} are now friends!`]
      );
    }

    res.json({ message: "Follow back completed", mutual: toggleResult.is_mutual });
  } catch (err) {
    console.error("Error in followBackController:", err);
    res.status(500).json({ message: "Server error" });
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
