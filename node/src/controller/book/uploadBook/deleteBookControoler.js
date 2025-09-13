const db = require("../../../config/db");
const { deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

const deleteBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const member_id = req.user.user_id;

    if (!bookQid) {
      return res.status(400).json({ message: "Missing bookQid", Result: "False" });
    }

    const [existingBook] = await db.query(
      "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (existingBook.length === 0) {
      return res.status(403).json({
        message: "Unauthorized or Book not found",
        Result: "False",
      });
    }

    const book = existingBook[0];

    // Delete S3 files if exist
    if (book.bookCover) await deleteFromS3(book.bookCover);
    if (book.bookFile) await deleteFromS3(book.bookFile);

    const [result] = await db.query(
      "DELETE FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not deleted", Result: "False" });
    }

    res.json({ message: "Book and related files deleted successfully", Result: "True" });

  } catch (error) {
    console.error("deleteBookController.js error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { deleteBook };
