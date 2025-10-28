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
const { sendPushToMember } = require("../../service/pushController");

// Helper: check if user is online via global.io
const isUserOnline = (memberQid) => {
  for (const [id, socket] of global.io.of('/').sockets) {
    if (socket.user && socket.user.memberQid === memberQid) return true;
  }
  return false;
};

// ✅ Save a message
const saveChatMessage = async (roomId, senderQid, message, senderName = "Someone") => {
  try {
    const [roomRows] = await db.query(
      "SELECT buyerQid, sellerQid, buyerDeleted, sellerDeleted FROM chatRooms WHERE roomId = ?",
      [roomId]
    );

    if (!roomRows.length) throw new Error("Room not found");

    const room = roomRows[0];
    const { buyerQid, sellerQid, buyerDeleted, sellerDeleted } = room;
    const receiverQid = senderQid === buyerQid ? sellerQid : buyerQq;

    console.log("🔹 Sending message in room:", roomId, { senderQid, receiverQid });

    // 🧠 Restore soft-deleted room for the receiver if needed
    const [updateResult] = await db.query(
      `UPDATE chatRooms SET 
         buyerDeleted = CASE WHEN buyerDeleted = 1 AND buyerQid = ? THEN 0 ELSE buyerDeleted END,
         sellerDeleted = CASE WHEN sellerDeleted = 1 AND sellerQid = ? THEN 0 ELSE sellerDeleted END
       WHERE roomId = ?`,
      [receiverQid, receiverQid, roomId]
    );
    console.log("✅ Soft-delete flags updated:", updateResult);

    // 💬 Insert the new message
    const [result] = await db.query(
      `INSERT INTO messages (roomId, senderQid, receiverQid, message, status, created_at)
       VALUES (?, ?, ?, ?, 'sent', NOW())`,
      [roomId, senderQid, receiverQid, message]
    );

    const savedMessage = {
      messageId: result.insertId,
      roomId,
      senderQid,
      receiverQid,
      message,
      status: "sent",
      created_at: new Date(),
    };

    // 🔔 Push notification if receiver is offline
    if (!isUserOnline(receiverQid)) {
      const payload = {
        title: `New message from ${senderName}`,
        body: message.slice(0, 120),
        url: `/chat/${roomId}`, // adjust to your frontend route
      };
      const pushResults = await sendPushToMember(receiverQid, payload);
      console.log("🔔 Push notification results:", pushResults);
    }

    return savedMessage;
  } catch (err) {
    console.error("❌ Error saving chat message:", err);
    return null;
  }
};
// const saveChatMessage = async (roomId, senderQid, message) => {
//   try {
//     const [roomRows] = await db.query(
//       "SELECT buyerQid, sellerQid, buyerDeleted, sellerDeleted FROM chatRooms WHERE roomId = ?",
//       [roomId]
//     );

//     if (!roomRows.length) throw new Error("Room not found");

//     const room = roomRows[0];
//     const { buyerQid, sellerQid, buyerDeleted, sellerDeleted } = room;
//     const receiverQid = senderQid === buyerQid ? sellerQid : buyerQid;

//     console.log("🔹 Sending message in room:", roomId);
//     console.log({
//       senderQid,
//       receiverQid,
//       buyerDeleted,
//       sellerDeleted,
//     });

//     // 🧠 Restore soft-deleted room for the receiver if needed
//     let updateQuery = `
//       UPDATE chatRooms SET 
//         buyerDeleted = CASE WHEN buyerDeleted = 1 AND buyerQid = ? THEN 0 ELSE buyerDeleted END,
//         sellerDeleted = CASE WHEN sellerDeleted = 1 AND sellerQid = ? THEN 0 ELSE sellerDeleted END
//       WHERE roomId = ?`;
    
//     const [updateResult] = await db.query(updateQuery, [receiverQid, receiverQid, roomId]);

//     console.log("✅ Soft-delete flags updated:", updateResult);

//     // 💬 Insert the new message
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
//       created_at: new Date(),
//     };
//   } catch (err) {
//     console.error("❌ Error saving chat message:", err);
//     return null;
//   }
// };




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
    const type = req.query.type || "order"; // can be: 'order', 'friend', 'archive'

    let sql = `
      SELECT 
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
    `;

    // 🧩 Handle query type logic (normal vs archive)
    if (type === "archive") {
      sql += `
        AND (
          (r.buyerQid = ? AND r.buyerArchived = 1 AND r.buyerDeleted = 0)
          OR (r.sellerQid = ? AND r.sellerArchived = 1 AND r.sellerDeleted = 0)
        )
      `;
    } else {
      sql += `
        AND (
          (r.buyerQid = ? AND r.buyerArchived = 0 AND r.buyerDeleted = 0)
          OR (r.sellerQid = ? AND r.sellerArchived = 0 AND r.sellerDeleted = 0)
        )
        AND r.type = ?
      `;
    }

    sql += ` ORDER BY lastMessageTime DESC`;

    const params =
      type === "archive"
        ? [userQid, userQid, userQid, userQid, userQid, userQid]
        : [userQid, userQid, userQid, userQid, userQid, userQid, type];

    const [rows] = await db.query(sql, params);

    res.json({ rooms: rows });
  } catch (err) {
    console.error("❌ Error fetching chat rooms:", err);
    res.status(500).json({ message: "Failed to load chat rooms" });
  }
};





const archiveRoom = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { roomId } = req.params;

    const [rows] = await db.query(
      "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
      [roomId]
    );
    if (!rows.length) return res.status(404).json({ message: "Room not found" });

    const room = rows[0];
    let column = "";

    if (room.buyerQid === memberQid) column = "buyerArchived";
    else if (room.sellerQid === memberQid) column = "sellerArchived";
    else return res.status(403).json({ message: "Not your chat" });

    await db.query(`UPDATE chatRooms SET ${column} = 1 WHERE roomId = ?`, [roomId]);

    res.json({ message: "Conversation archived" });
  } catch (err) {
    console.error("❌ Archive failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};



const unarchiveRoom = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { roomId } = req.params;

    const [rows] = await db.query(
      "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
      [roomId]
    );
    if (!rows.length) return res.status(404).json({ message: "Room not found" });

    const room = rows[0];
    let column = "";

    if (room.buyerQid === memberQid) column = "buyerArchived";
    else if (room.sellerQid === memberQid) column = "sellerArchived";
    else return res.status(403).json({ message: "Not your chat" });

    await db.query(`UPDATE chatRooms SET ${column} = 0 WHERE roomId = ?`, [roomId]);

    res.json({ message: "Conversation unarchived" });
  } catch (err) {
    console.error("❌ Unarchive failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Soft delete a chat room (individual)
const softDeleteRoom = async (req, res) => {
  try {
    const userQid = req.user.memberQid;
    const { roomId } = req.params;

    // Get room info
    const [rows] = await db.query(
      `SELECT buyerQid, sellerQid, buyerDeleted, sellerDeleted 
       FROM chatRooms WHERE roomId = ?`,
      [roomId]
    );
    if (!rows.length) return res.status(404).json({ message: "Room not found" });

    const room = rows[0];
    let fieldToUpdate = null;
    if (room.buyerQid === userQid) fieldToUpdate = "buyerDeleted";
    else if (room.sellerQid === userQid) fieldToUpdate = "sellerDeleted";
    else return res.status(403).json({ message: "Not your room" });

    // 🟡 Step 1: Soft delete (set user flag)
    await db.query(`UPDATE chatRooms SET ${fieldToUpdate} = 1 WHERE roomId = ?`, [roomId]);

    // 🟢 Step 2: Re-check current status from DB
    const [check] = await db.query(
      `SELECT buyerDeleted, sellerDeleted FROM chatRooms WHERE roomId = ?`,
      [roomId]
    );
    const { buyerDeleted, sellerDeleted } = check[0];

    // 🧨 Step 3: If both deleted, hard delete
    if (buyerDeleted && sellerDeleted) {
      await db.query(`DELETE FROM messages WHERE roomId = ?`, [roomId]);
      await db.query(`DELETE FROM chatRooms WHERE roomId = ?`, [roomId]);
      return res.json({ message: "Room permanently deleted" });
    }

    res.json({ message: "Room soft deleted" });
  } catch (err) {
    console.error("❌ Error soft deleting chat room:", err);
    res.status(500).json({ message: "Failed to delete chat room" });
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
  unarchiveRoom,
  softDeleteRoom
};
