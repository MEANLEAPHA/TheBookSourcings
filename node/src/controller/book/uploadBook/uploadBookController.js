const db = require('../../../config/db');

const uploadBook = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userEmail = req.user.email;

    const { title, subtitle, summary, author, category, genre, language, pageCount, isnb10, isnb13, publisher, publishedDate, comment, download, share } = req.body;

    // Check required fields
    if (!title || !subtitle || !summary || !author || !category || !language || !comment || !share || !download || !req.files.bookCover || !req.files.bookFile) {
      return res.status(400).json({ message: "Please enter all required fields before upload" });
    }

    // Get URLs from S3 upload
    const coverUrl = req.files.bookCover[0].location;  // multer-s3 provides 'location'
    const fileUrl  = req.files.bookFile[0].location;

    // Save metadata + URLs in MySQL
    const [result] = await db.query(
      `INSERT INTO todo_tasks 
      (member_id, member_email, title, subTitle, author, summary, mainCategory, genre, language, pageCount, ISBN10, ISBN13, publisher, publishDate, comment, download, share, coverUrl, fileUrl) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, userEmail, title, subtitle, author, summary, category, genre, language, pageCount, isnb10, isnb13, publisher, publishedDate, comment, download, share, coverUrl, fileUrl]
    );

    res.json({
      message: "Upload Book successfully",
      coverUrl,
      fileUrl
    });
  } catch (error) {
    console.error("uploadBookController.js Error:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { uploadBook };
