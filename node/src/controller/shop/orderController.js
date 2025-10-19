// const db = require("../../config/db");


// const orderBook = async (req, res) => {
//   try {
//     const buyerQid = req.user.memberQid; 
//     const { bookSid } = req.body;

//     if (!bookSid) {
//       return res.status(400).json({ message: "Missing bookSid." });
//     }

//     // ✅ 1. Get book info (seller)
//     const [bookRows] = await db.query(
//       "SELECT memberQid AS sellerQid, title FROM bookForsale WHERE bookSid = ?",
//       [bookSid]
//     );

//     if (bookRows.length === 0) {
//       return res.status(404).json({ message: "Book not found." });
//     }

//     const { sellerQid, title } = bookRows[0];

//     if (sellerQid === buyerQid) {
//       return res.status(400).json({ message: "You cannot order your own book." });
//     }

//     // ✅ 2. Check if chat room already exists
//     const [existingRoom] = await db.query(
//       `SELECT * FROM chatRooms 
//        WHERE buyerQid = ? AND sellerQid = ? AND bookSid = ?
//        LIMIT 1`,
//       [buyerQid, sellerQid, bookSid]
//     );

//     let roomId;
//     if (existingRoom.length > 0) {
//       roomId = existingRoom[0].roomId;
//     } else {
//       // ✅ 3. Create a new chat room
//       const [result] = await db.query(
//         `INSERT INTO chatRooms (buyerQid, sellerQid, bookSid, created_at) 
//          VALUES (?, ?, ?, NOW())`,
//         [buyerQid, sellerQid, bookSid]
//       );
//       roomId = result.insertId;
//     }

//     // ✅ 4. Log order record
//     await db.query(
//       `INSERT INTO bookOrders (buyerQid, sellerQid, bookSid, ordered_at) 
//        VALUES (?, ?, ?, NOW())`,
//       [buyerQid, sellerQid, bookSid]
//     );

//     // ✅ 5. (Optional) Add default message
//     await db.query(
//       `INSERT INTO messages (roomId, senderQid, receiverQid, message, created_at)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [roomId, buyerQid, sellerQid, `Hi, I want to buy your book "${title}"`,]
//     );

//     return res.status(200).json({
//       message: `Chat room ready for ordering "${title}"`,
//       roomId,
//       sellerQid,
//     });
//   } catch (error) {
//     console.error("Error in orderBook:", error);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// const ensureChatRoom = async (buyerQid, sellerQid) => {
//   try {
//     // Check if chat room exists
//     const [rows] = await db.query(
//       `SELECT roomId FROM chatRooms 
//        WHERE (buyerQid = ? AND sellerQid = ?) 
//           OR (buyerQid = ? AND sellerQid = ?) 
//        LIMIT 1`,
//       [buyerQid, sellerQid, sellerQid, buyerQid]
//     );

//     if (rows.length > 0) {
//       return rows[0].roomId; // existing room
//     }

//     // Otherwise, create a new one
//     const [result] = await db.query(
//       `INSERT INTO chatRooms (buyerQid, sellerQid, created_at) VALUES (?, ?, NOW())`,
//       [buyerQid, sellerQid]
//     );

//     return result.insertId; // new roomId
//   } catch (err) {
//     console.error("❌ Error ensuring chat room:", err);
//   }
// };

// module.exports = { orderBook };
const db = require("../../config/db");

// 🧠 Reusable helper to ensure a chat room exists (works for both order + friend chats)
const ensureChatRoom = async (buyerQid, sellerQid, type = "order", bookSid = null) => {
  try {
    // ✅ Check if chat room already exists (one room per buyer–seller pair)
    const [rows] = await db.query(
      `SELECT roomId FROM chatRooms 
       WHERE ((buyerQid = ? AND sellerQid = ?) OR (buyerQid = ? AND sellerQid = ?))
         AND type = ?
       LIMIT 1`,
      [buyerQid, sellerQid, sellerQid, buyerQid, type]
    );

    if (rows.length > 0) {
      return rows[0].roomId; // existing room
    }

    // ✅ Otherwise, create new one
    const [result] = await db.query(
      `INSERT INTO chatRooms (buyerQid, sellerQid, type, bookSid, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [buyerQid, sellerQid, type, bookSid]
    );

    return result.insertId; // new roomId
  } catch (err) {
    console.error("❌ Error ensuring chat room:", err);
    throw err;
  }
};

// 🛒 Order a book → ensure chat room and record order
const orderBook = async (req, res) => {
  try {
    const buyerQid = req.user.memberQid;
    const { bookSid } = req.body;

    if (!bookSid) {
      return res.status(400).json({ message: "Missing bookSid." });
    }

    // ✅ 1. Get book and seller info
    const [bookRows] = await db.query(
      "SELECT memberQid AS sellerQid, title FROM bookForsale WHERE bookSid = ?",
      [bookSid]
    );
    if (bookRows.length === 0) {
      return res.status(404).json({ message: "Book not found." });
    }

    const { sellerQid, title } = bookRows[0];

    if (sellerQid === buyerQid) {
      return res.status(400).json({ message: "You cannot order your own book." });
    }

    // ✅ 2. Ensure chat room (type = "order")
    const roomId = await ensureChatRoom(buyerQid, sellerQid, "order", bookSid);

    // ✅ 3. Record the book order
    await db.query(
      `INSERT INTO bookOrders (buyerQid, sellerQid, bookSid, ordered_at)
       VALUES (?, ?, ?, NOW())`,
      [buyerQid, sellerQid, bookSid]
    );

    // ✅ 4. Optional: send first message only if it's a new room
    await db.query(
      `INSERT INTO messages (roomId, senderQid, receiverQid, message, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [roomId, buyerQid, sellerQid, `Hi, I want to buy your book "${title}"`]
    );

    return res.status(200).json({
      message: `Chat room ready for ordering "${title}"`,
      roomId,
      sellerQid,
    });
  } catch (error) {
    console.error("Error in orderBook:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { orderBook, ensureChatRoom };
