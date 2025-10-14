const db = require('../../../config/db');
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

const updateBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const member_id = req.user.user_id;

    // Fetch existing book
    const [books] = await db.query(
      "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found or not authorized" });
    }

    const oldBook = books[0];
    let bookCoverUrl = oldBook.bookCover;
    let bookFileUrl = oldBook.bookFile;

    // Handle new file uploads
    if (req.files?.bookCover) {
      const newCover = await uploadToS3(req.files.bookCover[0], "covers/");
      if (oldBook.bookCover) await deleteFromS3(oldBook.bookCover);
      bookCoverUrl = newCover;
    }

    if (req.files?.bookFile) {
      const newFile = await uploadToS3(req.files.bookFile[0], "books/");
      if (oldBook.bookFile) await deleteFromS3(oldBook.bookFile);
      bookFileUrl = newFile;
    }

    const {
      title, subTitle, summary, author, authorId, mainCategory, genre, language,
      pageCount, ISBN10, ISBN13, publisher, publishDate, comment,
      download, share
    } = req.body;

    await db.query(
      `UPDATE uploadBook 
       SET title=?, subTitle=?, summary=?, author=?, authorId, mainCategory=?, genre=?, language=?, 
           pageCount=?, ISBN10=?, ISBN13=?, publisher=?, publishDate=?, comment=?, download=?, share=?, 
           bookCover=?, bookFile=? 
       WHERE bookQid=? AND member_id=?`,
      [title, subTitle, summary, JSON.parse(author), JSON.parse(authorId), mainCategory, genre, language, pageCount, ISBN10, ISBN13,
       publisher, publishDate, comment, download, share, bookCoverUrl, bookFileUrl, bookQid, member_id]
    );

    res.json({ message: "Book updated successfully" });

  } catch (error) {
    console.error("updateBookController.js Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { updateBook };
