// controller/shop/clearBookFileController.js
const db = require("../../config/db");

const clearBookFile = async (req, res) => {
  const { bookSid } = req.params;
  try {
    await db.query("UPDATE bookForsale SET bookFile = NULL WHERE bookSid = ?", [bookSid]);
    res.json({ success: true, message: "bookFile cleared successfully" });
  } catch (error) {
    console.error("clearBookFile error:", error);
    res.status(500).json({ success: false, message: "Failed to clear bookFile" });
  }
};

module.exports = { clearBookFile };
