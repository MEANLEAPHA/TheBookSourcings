const db = require("../../../config/db");
const { deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

// const deleteBook = async (req, res) => {
//   try {
//     const { bookQid } = req.params;
//     const member_id = req.user.user_id;

//     if (!bookQid) {
//       return res.status(400).json({ message: "Missing bookQid", Result: "False" });
//     }

//     const [existingBook] = await db.query(
//       "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
//       [bookQid, member_id]
//     );

//     if (existingBook.length === 0) {
//       return res.status(403).json({
//         message: "Unauthorized or Book not found",
//         Result: "False",
//       });
//     }

//     const book = existingBook[0];

//     // Delete S3 files if exist
//     if (book.bookCover) await deleteFromS3(book.bookCover);
//     if (book.bookFile) await deleteFromS3(book.bookFile);

//     const [result] = await db.query(
//       "DELETE FROM uploadBook WHERE bookQid = ? AND member_id = ?",
//       [bookQid, member_id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ message: "Book not deleted", Result: "False" });
//     }

//     res.json({ message: "Book and related files deleted successfully", Result: "True" });

//   } catch (error) {
//     console.error("deleteBookController.js error:", error);
//     res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// };
const deleteBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const authorQid = req.user.authorQid; // from JWT
    const userId = req.user.user_id;

    if (!bookQid) {
      return res.status(400).json({ message: "Missing bookQid", Result: "False" });
    }

    // Find the book that this author is part of
    const [books] = await db.query(
      `SELECT * FROM uploadBook 
       WHERE JSON_CONTAINS(authorId, JSON_QUOTE(?)) 
       AND bookQid = ?`,
      [authorQid, bookQid]
    );

    if (books.length === 0) {
      return res.status(403).json({ message: "You are not an author of this book.", Result: "False" });
    }

    const book = books[0];

    // Case 1: Only the main author can delete
    if (book.fullController === "inactive" && book.member_id !== userId) {
      return res.status(403).json({ 
        message: "You don’t have permission to delete this book.", 
        Result: "False" 
      });
    }

    // Case 2: If full control is active, any author can delete
    if (book.fullController === "active") {
      console.log(`Full control is active — allowing ${authorQid} to delete.`);
    }

    // Delete S3 files if exist
    if (book.bookCover) await deleteFromS3(book.bookCover);
    if (book.bookFile) await deleteFromS3(book.bookFile);

    // Delete from DB
    const [result] = await db.query("DELETE FROM uploadBook WHERE bookQid = ?", [bookQid]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found or already deleted", Result: "False" });
    }

    res.status(200).json({ message: "Book deleted successfully", Result: "True" });

  } catch (error) {
    console.error("deleteBook error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports = { deleteBook };
