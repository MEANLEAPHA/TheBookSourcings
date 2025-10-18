const db = require("../../config/db");

// ✅ Order book and create/join chat room
const orderBook = async (req, res) => {
  try {
    const buyerQid = req.user.memberQid; // from JWT middleware
    const { bookSid } = req.body;

    if (!bookSid) {
      return res.status(400).json({ message: "Missing bookSid." });
    }

    // ✅ 1. Get book info (seller)
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

    // ✅ 2. Check if chat room already exists
    const [existingRoom] = await db.query(
      `SELECT * FROM chatRooms 
       WHERE buyerQid = ? AND sellerQid = ? AND bookSid = ?
       LIMIT 1`,
      [buyerQid, sellerQid, bookSid]
    );

    let roomId;
    if (existingRoom.length > 0) {
      roomId = existingRoom[0].roomId;
    } else {
      // ✅ 3. Create a new chat room
      const [result] = await db.query(
        `INSERT INTO chatRooms (buyerQid, sellerQid, bookSid, created_at) 
         VALUES (?, ?, ?, NOW())`,
        [buyerQid, sellerQid, bookSid]
      );
      roomId = result.insertId;
    }

    // ✅ 4. Log order record
    await db.query(
      `INSERT INTO bookOrders (buyerQid, sellerQid, bookSid, ordered_at) 
       VALUES (?, ?, ?, NOW())`,
      [buyerQid, sellerQid, bookSid]
    );

    // ✅ 5. (Optional) Add default message
    await db.query(
      `INSERT INTO messages (roomId, senderQid, receiverQid, message, created_at)
       VALUES (?, ?, ?, ?)`,
      [roomId, buyerQid, sellerQid, `Hi, I want to buy your book "${title}"`,]
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

module.exports = { orderBook };
