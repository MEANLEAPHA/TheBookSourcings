const db = require("../../../config/db");

/**
 * 💾 Save a new chat message
 * Called by socket when someone sends a message
 */
const saveChatMessage = async (roomId, senderQid, message) => {
  try {
    // Get receiver dynamically
    const [roomRows] = await db.query(
      "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
      [roomId]
    );
    if (!roomRows.length) throw new Error("Room not found");

    const { buyerQid, sellerQid } = roomRows[0];
    const receiverQid = senderQid === buyerQid ? sellerQid : buyerQid;

    await db.query(
      `INSERT INTO messages (roomId, senderQid, receiverQid, message, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [roomId, senderQid, receiverQid, message]
    );
  } catch (err) {
    console.error("❌ Error saving chat message:", err);
  }
};


/**
 * 📜 Get all messages in a chat room
 * Called by REST API when user loads chat page
 */
const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if roomId exists
    if (!roomId) {
      return res.status(400).json({ message: "Missing roomId parameter." });
    }

    // Fetch messages sorted by time
    const [rows] = await db.query(
      `SELECT 
          m.messageId,
          m.roomId,
          m.senderQid,
          m.receiverQid,
          m.message,
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
  getUserChatRooms
};
