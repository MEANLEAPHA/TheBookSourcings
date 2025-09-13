const db = require("../../../config/db");

// --- Get single book by bookQid for update form
const getBookByQid = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const member_id = req.user.user_id;

    if (!bookQid) {
      return res.status(400).json({ message: "Missing bookQid" });
    }

    const [rows] = await db.query(
      "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Book not found or unauthorized" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getBookByQid error:", err.message);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
// --- Get all books for the logged-in user
const getMyBooks = async (req, res) => {
  try {
    const member_id = req.user.user_id;

    const [rows] = await db.query(
      "SELECT * FROM uploadBook WHERE member_id = ? ORDER BY UploadAt DESC",
      [member_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("getMyBooks error:", err.message);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { getBookByQid, getMyBooks };
