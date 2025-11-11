const db = require("../../../config/db");

const userRoomChatController = async (req, res) => {
  try {
    const memeberQid = req.user.memberQid;

    const [rows] = await db.query(
      `SELECT u.memberQid, u.pfUrl
       FROM chatRooms cr
       JOIN users u 
         ON (u.memberQid = cr.buyerQid AND cr.sellerQid = ?)
         OR (u.memberQid = cr.sellerQid AND cr.buyerQid = ?)
       ORDER BY cr.created_at DESC
       LIMIT 3;`,
      [memeberQid, memeberQid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No mutual chats found" });
    }

    res.status(200).json({
      status: true,
      data: rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      error: err.message
    });
  }
};

module.exports = {userRoomChatController};
