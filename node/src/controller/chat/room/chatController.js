const db = require("../../../config/db");

// saveChatMessage: return full saved object (you already do this but ensure it returns)
// const markMessageDelivered = async (roomId, receiverQid) => {
//   try {
//     // select messageIds that will be updated
//     const [rows] = await db.query(
//       `SELECT messageId FROM messages WHERE roomId = ? AND receiverQid = ? AND status = 'sent'`,
//       [roomId, receiverQid]
//     );
//     const ids = rows.map(r => r.messageId);
//     if (!ids.length) return [];

//     // update them to delivered
//     await db.query(
//       `UPDATE messages SET status = 'delivered' WHERE messageId IN (?)`,
//       [ids]
//     );

//     return ids;
//   } catch (err) {
//     console.error("❌ Error marking message delivered:", err);
//     return [];
//   }
// };

// const markAllMessagesSeen = async (roomId, viewerQid) => {
//   try {
//     // find all sent/delivered messages for this viewer in this room
//     const [rows] = await db.query(
//       `SELECT messageId FROM messages WHERE roomId = ? AND receiverQid = ? AND status != 'seen'`,
//       [roomId, viewerQid]
//     );
//     const ids = rows.map(r => r.messageId);
//     if (!ids.length) return [];

//     await db.query(
//       `UPDATE messages SET status = 'seen', receiverSeen = 1, seen_at = NOW() WHERE messageId IN (?)`,
//       [ids]
//     );
//     return ids;
//   } catch (err) {
//     console.error("❌ Error marking all messages seen:", err);
//     return [];
//   }
// };
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

const markMessageDelivered = async (roomId, receiverQid) => {
  try {
    // return list of IDs that were updated
    const [rows] = await db.query(
      `SELECT messageId FROM messages 
       WHERE roomId = ? AND receiverQid = ? AND status = 'sent'`,
      [roomId, receiverQid]
    );
    if (!rows.length) return [];

    const ids = rows.map(r => r.messageId);
    await db.query(
      `UPDATE messages SET status = 'delivered', receiverSeen = 0 WHERE messageId IN (${ids.map(()=>'?').join(',')})`,
      ids
    );
    return ids;
  } catch (err) {
    console.error("❌ Error marking message delivered:", err);
    return [];
  }
};

const markAllMessagesSeen = async (roomId, viewerQid) => {
  try {
    // select message ids where viewer is receiver and not yet seen
    const [rows] = await db.query(
      `SELECT messageId FROM messages 
       WHERE roomId = ? AND receiverQid = ? AND receiverSeen = 0`,
      [roomId, viewerQid]
    );
    if (!rows.length) return [];

    const ids = rows.map(r => r.messageId);
    await db.query(
      `UPDATE messages SET receiverSeen = 1, status = 'seen', seen_at = NOW() 
       WHERE messageId IN (${ids.map(()=>'?').join(',')})`,
      ids
    );

    return ids;
  } catch (err) {
    console.error("❌ Error marking all messages seen:", err);
    return [];
  }
};


// ✅ Mark message as seen
const markMessageSeen = async (messageId, viewerQid) => {
  try {
    const [rows] = await db.query(
      `SELECT receiverQid, status FROM messages WHERE messageId = ?`,
      [messageId]
    );
    if (!rows.length) return false;
    const msg = rows[0];
    if (msg.receiverQid !== viewerQid) return false; // only receiver can mark as seen
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





// ✅ Get all messages (load on open)
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
// Update message
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

// Delete message
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


// 📦 Get all rooms for a user
const getUserChatRooms = async (req, res) => {
  try {
    const userQid = req.user.memberQid;

    const [rows] = await db.query(
      `SELECT 
          r.roomId,
          CASE 
            WHEN r.buyerQid = ? THEN r.sellerQid
            ELSE r.buyerQid
          END AS otherUserQid,
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
         ON u.memberQid = CASE 
                            WHEN r.buyerQid = ? THEN r.sellerQid
                            ELSE r.buyerQid
                          END
       WHERE r.buyerQid = ? OR r.sellerQid = ?
       ORDER BY lastMessageTime DESC`,
      [userQid, userQid, userQid, userQid]
    );

    res.json({ rooms: rows });
  } catch (err) {
    console.error("❌ Error fetching chat rooms:", err);
    res.status(500).json({ message: "Failed to load chat rooms" });
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
  markAllMessagesSeen
};
