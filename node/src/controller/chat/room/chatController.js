// const db = require("../../../config/db");
// const saveChatMessage = async (roomId, senderQid, message) => {
//   try {
//     const [roomRows] = await db.query(
//       "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
//       [roomId]
//     );
//     if (!roomRows.length) throw new Error("Room not found");
//     const { buyerQid, sellerQid } = roomRows[0];
//     const receiverQid = senderQid === buyerQid ? sellerQid : buyerQid;

//     const [result] = await db.query(
//       `INSERT INTO messages (roomId, senderQid, receiverQid, message, status, created_at)
//        VALUES (?, ?, ?, ?, 'sent', NOW())`,
//       [roomId, senderQid, receiverQid, message]
//     );

//     return {
//       messageId: result.insertId,
//       roomId,
//       senderQid,
//       receiverQid,
//       message,
//       status: "sent",
//       created_at: new Date()
//     };
//   } catch (err) {
//     console.error("❌ Error saving chat message:", err);
//     return null;
//   }
// };

// const markMessageDelivered = async (roomId, receiverQid) => {
//   try {
//     // return list of IDs that were updated
//     const [rows] = await db.query(
//       `SELECT messageId FROM messages 
//        WHERE roomId = ? AND receiverQid = ? AND status = 'sent'`,
//       [roomId, receiverQid]
//     );
//     if (!rows.length) return [];

//     const ids = rows.map(r => r.messageId);
//     await db.query(
//       `UPDATE messages SET status = 'delivered', receiverSeen = 0 WHERE messageId IN (${ids.map(()=>'?').join(',')})`,
//       ids
//     );
//     return ids;
//   } catch (err) {
//     console.error("❌ Error marking message delivered:", err);
//     return [];
//   }
// };

// const markAllMessagesSeen = async (roomId, viewerQid) => {
//   try {
//     // select message ids where viewer is receiver and not yet seen
//     const [rows] = await db.query(
//       `SELECT messageId FROM messages 
//        WHERE roomId = ? AND receiverQid = ? AND receiverSeen = 0`,
//       [roomId, viewerQid]
//     );
//     if (!rows.length) return [];

//     const ids = rows.map(r => r.messageId);
//     await db.query(
//       `UPDATE messages SET receiverSeen = 1, status = 'seen', seen_at = NOW() 
//        WHERE messageId IN (${ids.map(()=>'?').join(',')})`,
//       ids
//     );

//     return ids;
//   } catch (err) {
//     console.error("❌ Error marking all messages seen:", err);
//     return [];
//   }
// };


// // ✅ Mark message as seen
// const markMessageSeen = async (messageId, viewerQid) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT receiverQid, status FROM messages WHERE messageId = ?`,
//       [messageId]
//     );
//     if (!rows.length) return false;
//     const msg = rows[0];
//     if (msg.receiverQid !== viewerQid) return false; // only receiver can mark as seen
//     if (msg.status === 'seen') return true;

//     await db.query(
//       `UPDATE messages SET status = 'seen', receiverSeen = 1, seen_at = NOW() WHERE messageId = ?`,
//       [messageId]
//     );
//     return true;
//   } catch (err) {
//     console.error("❌ Error marking message seen:", err);
//     return false;
//   }
// };





// // ✅ Get all messages (load on open)
// const getChatMessages = async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     if (!roomId) return res.status(400).json({ message: "Missing roomId" });

//     const [rows] = await db.query(
//       `SELECT 
//         m.messageId,
//         m.roomId,
//         m.senderQid,
//         m.receiverQid,
//         m.message,
//         m.status,
//         m.created_at,
//         u.username AS senderName
//        FROM messages m
//        LEFT JOIN users u ON m.senderQid = u.memberQid
//        WHERE m.roomId = ?
//        ORDER BY m.created_at ASC`,
//       [roomId]
//     );

//     return res.status(200).json({ messages: rows });
//   } catch (err) {
//     console.error("❌ Error fetching chat messages:", err);
//     return res.status(500).json({ message: "Failed to load chat messages" });
//   }
// };
// // Update message
// const updateChatMessage = async (messageId, senderQid, newMessage) => {
//   try {
//     const [result] = await db.query(
//       `UPDATE messages SET message = ? WHERE messageId = ? AND senderQid = ?`,
//       [newMessage, messageId, senderQid]
//     );
//     return result.affectedRows;
//   } catch (err) {
//     console.error("❌ Error updating message:", err);
//   }
// };

// // Delete message
// const deleteChatMessage = async (messageId, senderQid) => {
//   try {
//     const [result] = await db.query(
//       `DELETE FROM messages WHERE messageId = ? AND senderQid = ?`,
//       [messageId, senderQid]
//     );
//     return result.affectedRows;
//   } catch (err) {
//     console.error("❌ Error deleting message:", err);
//   }
// };


// // 📦 Get all rooms for a user
// const getUserChatRooms = async (req, res) => {
//   try {
//     const userQid = req.user.memberQid;

//     const [rows] = await db.query(
//       `SELECT 
//           r.roomId,
//           CASE 
//             WHEN r.buyerQid = ? THEN r.sellerQid
//             ELSE r.buyerQid
//           END AS otherUserQid,
//           u.username AS otherUsername,
//           u.pfUrl AS otherProfileImg,
//           (SELECT message FROM messages 
//              WHERE roomId = r.roomId 
//              ORDER BY created_at DESC 
//              LIMIT 1) AS lastMessage,
//           (SELECT created_at FROM messages 
//              WHERE roomId = r.roomId 
//              ORDER BY created_at DESC 
//              LIMIT 1) AS lastMessageTime
//        FROM chatRooms r
//        JOIN users u 
//          ON u.memberQid = CASE 
//                             WHEN r.buyerQid = ? THEN r.sellerQid
//                             ELSE r.buyerQid
//                           END
//        WHERE r.buyerQid = ? OR r.sellerQid = ?
//        ORDER BY lastMessageTime DESC`,
//       [userQid, userQid, userQid, userQid]
//     );

//     res.json({ rooms: rows });
//   } catch (err) {
//     console.error("❌ Error fetching chat rooms:", err);
//     res.status(500).json({ message: "Failed to load chat rooms" });
//   }
// };

// module.exports = {
//   saveChatMessage,
//   getChatMessages,
//   updateChatMessage,
//   deleteChatMessage,
//   getUserChatRooms,
//   markMessageSeen,
//   markMessageDelivered,
//   markAllMessagesSeen
// };
const db = require("../../../config/db");

// ✅ Save a message
const saveChatMessage = async (roomId, senderQid, message) => {
  try {
    const [roomRows] = await db.query(
      "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
      [roomId]
    );
    if (!roomRows.length) throw new Error("Room not found");

    const { buyerQid, sellerQid } = roomRows[0];
    const receiverQid = senderQid === buyerQid ? sellerQid : buyerQid;

    const [result] = await db.query(
      `INSERT INTO messages (roomId, senderQid, receiverQid, message, status, created_at)
       VALUES (?, ?, ?, ?, 'sent', NOW())`,
      [roomId, senderQid, receiverQid, message]
    );

    return {
      messageId: result.insertId,
      roomId,
      senderQid,
      receiverQid,
      message,
      status: "sent",
      created_at: new Date()
    };
  } catch (err) {
    console.error("❌ Error saving chat message:", err);
    return null;
  }
};

// ✅ Mark messages delivered
// const markMessageDelivered = async (roomId, receiverQid) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT messageId FROM messages 
//        WHERE roomId = ? AND receiverQid = ? AND status = 'sent'`,
//       [roomId, receiverQid]
//     );
//     if (!rows.length) return [];

//     const ids = rows.map(r => r.messageId);
//     await db.query(
//       `UPDATE messages SET status = 'delivered', receiverSeen = 0 WHERE messageId IN (${ids.map(() => '?').join(',')})`,
//       ids
//     );
//     return ids;
//   } catch (err) {
//     console.error("❌ Error marking message delivered:", err);
//     return [];
//   }
// };
const markMessageDelivered = async (roomId, receiverQid) => {
  try {
    // Get all pending messages for this receiver in the room
    const [rows] = await db.query(
      `SELECT m.messageId 
       FROM messages m
       JOIN chatRooms r ON m.roomId = r.roomId
       WHERE m.roomId = ? 
         AND m.receiverQid = ? 
         AND m.status = 'sent'
         AND (r.type != 'archive')`, // optional: skip archived rooms
      [roomId, receiverQid]
    );

    if (!rows.length) return [];

    const ids = rows.map(r => r.messageId);

    // Update status to 'delivered' and reset receiverSeen
    await db.query(
      `UPDATE messages 
       SET status = 'delivered', receiverSeen = 0 
       WHERE messageId IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    return ids;
  } catch (err) {
    console.error("❌ Error marking messages delivered:", err);
    return [];
  }
};


// ✅ Mark all messages in a room as seen
const markAllMessagesSeen = async (roomId, viewerQid) => {
  try {
    const [rows] = await db.query(
      `SELECT messageId FROM messages 
       WHERE roomId = ? AND receiverQid = ? AND receiverSeen = 0`,
      [roomId, viewerQid]
    );
    if (!rows.length) return [];

    const ids = rows.map(r => r.messageId);
    await db.query(
      `UPDATE messages SET receiverSeen = 1, status = 'seen', seen_at = NOW() 
       WHERE messageId IN (${ids.map(() => '?').join(',')})`,
      ids
    );

    return ids;
  } catch (err) {
    console.error("❌ Error marking all messages seen:", err);
    return [];
  }
};

// ✅ Mark single message as seen
const markMessageSeen = async (messageId, viewerQid) => {
  try {
    const [rows] = await db.query(
      `SELECT receiverQid, status FROM messages WHERE messageId = ?`,
      [messageId]
    );
    if (!rows.length) return false;

    const msg = rows[0];
    if (msg.receiverQid !== viewerQq) return false; // only receiver can mark
    if (msg.status === 'seen') return true;

    await db.query(
      `UPDATE messages SET status = 'seen', receiverSeen = 1, seen_at = NOW() WHERE messageId = ?`,
      [messageId]
    );
    return true;
  } catch (err) {
    console.error("❌ Error marking message seen:", err);
    return false;
  }
};

// ✅ Get messages in a room
const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: "Missing roomId" });

    const [rows] = await db.query(
      `SELECT 
        m.messageId,
        m.roomId,
        m.senderQid,
        m.receiverQid,
        m.message,
        m.status,
        m.created_at,
        u.username AS senderName
       FROM messages m
       LEFT JOIN users u ON m.senderQid = u.memberQid
       WHERE m.roomId = ?
       ORDER BY m.created_at ASC`,
      [roomId]
    );

    return res.status(200).json({ messages: rows });
  } catch (err) {
    console.error("❌ Error fetching chat messages:", err);
    return res.status(500).json({ message: "Failed to load chat messages" });
  }
};

// ✅ Update message
const updateChatMessage = async (messageId, senderQid, newMessage) => {
  try {
    const [result] = await db.query(
      `UPDATE messages SET message = ? WHERE messageId = ? AND senderQid = ?`,
      [newMessage, messageId, senderQid]
    );
    return result.affectedRows;
  } catch (err) {
    console.error("❌ Error updating message:", err);
  }
};

// ✅ Delete message
const deleteChatMessage = async (messageId, senderQid) => {
  try {
    const [result] = await db.query(
      `DELETE FROM messages WHERE messageId = ? AND senderQid = ?`,
      [messageId, senderQid]
    );
    return result.affectedRows;
  } catch (err) {
    console.error("❌ Error deleting message:", err);
  }
};

// ✅ Get all rooms for a user, filtered by type ('friend', 'order', 'archive')
const getUserChatRooms = async (req, res) => {
  try {
    const userQid = req.user.memberQid;
    const type = req.query.type || 'order'; // default = 'order'

    const [rows] = await db.query(
      `SELECT 
          r.roomId,
          CASE WHEN r.buyerQid = ? THEN r.sellerQid ELSE r.buyerQid END AS otherUserQid,
          u.username AS otherUsername,
          u.pfUrl AS otherProfileImg,
          (SELECT message FROM messages 
             WHERE roomId = r.roomId 
             ORDER BY created_at DESC 
             LIMIT 1) AS lastMessage,
          (SELECT created_at FROM messages 
             WHERE roomId = r.roomId 
             ORDER BY created_at DESC 
             LIMIT 1) AS lastMessageTime
       FROM chatRooms r
       JOIN users u 
         ON u.memberQid = CASE WHEN r.buyerQid = ? THEN r.sellerQid ELSE r.buyerQid END
       WHERE (r.buyerQid = ? OR r.sellerQid = ?)
         AND r.type = ?
       ORDER BY lastMessageTime DESC`,
      [userQid, userQid, userQid, userQid, type]
    );

    res.json({ rooms: rows });
  } catch (err) {
    console.error("❌ Error fetching chat rooms:", err);
    res.status(500).json({ message: "Failed to load chat rooms" });
  }
};


// PUT /api/chat/archive/:roomId
export const archiveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const memberQid = req.user.memberQid;

    // ✅ Ensure this user is part of the room
    const [check] = await db.query(
      `SELECT * FROM chatRooms 
       WHERE roomId = ? 
         AND (buyerQid = ? OR sellerQid = ?)`,
      [roomId, memberQid, memberQid]
    );

    if (!check.length) {
      return res.status(403).json({ message: "Access denied: not part of this chat." });
    }

    // ✅ Move to archive
    await db.query(
      `UPDATE chatRooms 
       SET type = 'archive'
       WHERE roomId = ?`,
      [roomId]
    );

    res.json({ message: "Chat moved to archive ✅" });
  } catch (err) {
    console.error("❌ Error archiving room:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// PUT /api/chat/unarchive/:roomId
export const unarchiveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const memberQid = req.user.memberQid;

    // ✅ Ensure this user is part of the room
    const [check] = await db.query(
      `SELECT previousType FROM chatRooms 
       WHERE roomId = ? 
         AND (buyerQid = ? OR sellerQid = ?)`,
      [roomId, memberQid, memberQid]
    );

    if (!check.length) {
      return res.status(403).json({ message: "Access denied: not part of this chat." });
    }

    const { previousType } = check[0];
    if (!previousType) {
      return res.status(400).json({ message: "Missing previousType — cannot restore chat." });
    }

    // ✅ Restore original type (friend/order)
    await db.query(
      `UPDATE chatRooms 
       SET type = ?
       WHERE roomId = ?`,
      [previousType, roomId]
    );

    res.json({ message: `Chat restored to ${previousType} ✅` });
  } catch (err) {
    console.error("❌ Error unarchiving room:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  saveChatMessage,
  getChatMessages,
  updateChatMessage,
  deleteChatMessage,
  getUserChatRooms,
  markMessageSeen,
  markMessageDelivered,
  markAllMessagesSeen,
  archiveRoom,
  unarchiveRoom
};
