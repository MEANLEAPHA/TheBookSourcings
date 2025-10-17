const db = require("../../config/db");
const { deleteFromS3 } = require("../../middleware/AWSuploadMiddleware");

const deleteBook = async (req, res) => {
  try {
    const { bookSid } = req.params;
    const memberQid = req.user.memberQid;

    if (!bookSid) {
      return res.status(400).json({
        message: "Missing bookSid",
        Result: "False",
      });
    }

    // 1️⃣ Check if the book exists and belongs to this user
    const [existingBook] = await db.query(
      "SELECT * FROM bookForsale WHERE bookSid = ? AND memberQid = ?",
      [bookSid, memberQid]
    );

    if (existingBook.length === 0) {
      return res.status(403).json({
        message: "Unauthorized or Book not found",
        Result: "False",
      });
    }

    const book = existingBook[0];

    // 2️⃣ Delete files from S3 if they exist
    try {
      if (book.bookImg) await deleteFromS3(book.bookImg);

      if (book.imgPreview) {
        let imgPreviews = [];
        try {
          imgPreviews = JSON.parse(book.imgPreview);
        } catch (err) {
          console.warn("Failed to parse imgPreview JSON:", err);
        }

        for (const urlPreview of imgPreviews) {
          if (urlPreview) {
            try {
              await deleteFromS3(urlPreview);
            } catch (err) {
              console.error("Failed to delete preview from S3:", urlPreview, err);
            }
          }
        }
      }

      if (book.bookFile) await deleteFromS3(book.bookFile);
    } catch (fileError) {
      console.error("Error deleting S3 files:", fileError);
      // Not returning yet — we can still delete DB record even if S3 deletion partially failed
    }

    // 3️⃣ Delete from DB
    const [result] = await db.query(
      "DELETE FROM bookForsale WHERE bookSid = ? AND memberQid = ?",
      [bookSid, memberQid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Book not deleted",
        Result: "False",
      });
    }

    // 4️⃣ Success response
    res.json({
      message: "Book and related files deleted successfully",
      Result: "True",
    });
  } catch (error) {
    console.error("deleteBookController.js error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { deleteBook };
