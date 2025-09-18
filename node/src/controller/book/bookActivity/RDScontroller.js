// controllers/bookActivityController.js
const db = require("../../../config/db");

const recordActivity = async (req, res) => {
  try {
    const { bookId, type } = req.params; // activity type comes from URL
    const userId = req.user.user_id; // from JWT middleware

    const allowedTypes = ["read", "download", "share"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid activity type" });
    }

    // Insert into activity table
    await db.query(
      `INSERT INTO user_book_activity (user_id, bookQid, activity_type) VALUES (?,?,?)`,
      [userId, bookId, type]
    );

    // Update uploadBook counters (optional for fast display)
    await db.query(
      `UPDATE uploadBook 
       SET ${type}Count = ${type}Count + 1 
       WHERE bookQid = ?`,
      [bookId]
    );

    res.json({ message: `${type} recorded successfully!` });

  } catch (err) {
    console.error("recordActivity error:", err.message);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { recordActivity };
