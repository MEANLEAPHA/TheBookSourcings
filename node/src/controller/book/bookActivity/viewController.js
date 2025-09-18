const db = require("../../../config/db"); // adjust path to your db connection

// Record a view activity
async function addBookView(req, res) {
  try {
    const { bookId } = req.params;
      const userId = req.user.user_id; // comes from JWT middleware

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. User not logged in." });
    }

    // Insert activity
    await db.query(
      `INSERT INTO user_book_activity (user_id, bookQid, activity_type) 
       VALUES (?, ?, 'view')`,
      [userId, bookId]
    );

    res.json({ message: "View recorded successfully" });
  } catch (err) {
    console.error("Error recording view:", err);
    res.status(500).json({ error: "Failed to record view" });
  }
}

module.exports = { addBookView };
