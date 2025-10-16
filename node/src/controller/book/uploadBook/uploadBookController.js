const db = require('../../../config/db');
const { upload, uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

const uploadBook = async (req, res) => {
  try {
    const userId = req.user.user_id; 
    const userEmail = req.user.email;

    const { title, subtitle, summary, author, authorId ,category, genre, language, pageCount, isbn10, isbn13, publisher, publishedDate, comment, download, share, fullControl } = req.body;

    if (!title || !subtitle || !summary || !author || !authorId ||!category || !language || !comment || !share || !download || !fullControl || !req.files.bookCover || !req.files.bookFile) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Upload files to S3
    const bookCoverUrl = await uploadToS3(req.files.bookCover[0], "covers/");
    const bookFileUrl = await uploadToS3(req.files.bookFile[0], "books/");

      // Convert JSON string back to array
    const authorArr = JSON.parse(author);
    const authorIdArr = JSON.parse(authorId);
    try {
      // Save in DB
      const [result] = await db.query(
        "INSERT INTO uploadBook (member_id, member_email, title, subTitle, author, authorId, summary, mainCategory, genre, language, pageCount, ISBN10, ISBN13, publisher, publishDate, comment, download, share, fullController, bookCover, bookFile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, userEmail, title, subtitle, JSON.stringify(authorArr), JSON.stringify(authorIdArr), summary, category, genre, language, pageCount, isbn10, isbn13, publisher, publishedDate, comment, download, share, fullControl, bookCoverUrl, bookFileUrl]
      );

      res.json({ message: "Upload Book successfully" });
    } catch (dbError) {
      // Rollback: delete files from S3 if DB fails
      await deleteFromS3(bookCoverUrl);
      await deleteFromS3(bookFileUrl);
      throw dbError;
    }

  } catch (error) {
    console.error("uploadBookController.js Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { uploadBook };
