
const db = require('../../../config/db');
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

// const updateBook = async (req, res) => {
//   try {
//     const { bookQid } = req.params;
//     const member_id = req.user.user_id;

//     const [books] = await db.query(
//       "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
//       [bookQid, member_id]
//     );

//     if (books.length === 0)
//       return res.status(404).json({ message: "Book not found or not authorized" });

//     const oldBook = books[0];
//     let bookCoverUrl = oldBook.bookCover;
//     let bookFileUrl = oldBook.bookFile;

//     // --- Handle file uploads ---
//     if (req.files?.bookCover) {
//       const newCover = await uploadToS3(req.files.bookCover[0], "covers/");
//       if (oldBook.bookCover) await deleteFromS3(oldBook.bookCover);
//       bookCoverUrl = newCover;
//     }

//     if (req.files?.bookFile) {
//       const newFile = await uploadToS3(req.files.bookFile[0], "books/");
//       if (oldBook.bookFile) await deleteFromS3(oldBook.bookFile);
//       bookFileUrl = newFile;
//     }

//     const {
//       title, subTitle, summary, author, authorId, mainCategory, genre, language,
//       pageCount, ISBN10, ISBN13, publisher, publishDate, comment,
//       download, share
//     } = req.body;

//     const authorJson = JSON.stringify(JSON.parse(author || "[]"));
//     const authorIdJson = JSON.stringify(JSON.parse(authorId || "[]"));

//     await db.query(
//       `UPDATE uploadBook 
//        SET title=?, subTitle=?, summary=?, author=?, authorId=?, mainCategory=?, genre=?, language=?, 
//            pageCount=?, ISBN10=?, ISBN13=?, publisher=?, publishDate=?, comment=?, download=?, share=?, 
//            bookCover=?, bookFile=? 
//        WHERE bookQid=? AND member_id=?`,
//       [
//         title, subTitle, summary, authorJson, authorIdJson, mainCategory, genre, language,
//         pageCount, ISBN10, ISBN13, publisher, publishDate, comment, download, share,
//         bookCoverUrl, bookFileUrl, bookQid, member_id
//       ]
//     );

//     res.json({ message: "Book updated successfully" });

//   } catch (error) {
//     console.error("updateBookController.js Error:", error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };
const updateBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const member_id = req.user.user_id;
    const authorQid = req.user.authorQid; // if your user table has it

    // 🔍 Step 1: Check if user is uploader OR has full control
    const [books] = await db.query(
      `SELECT * 
       FROM uploadBook 
       WHERE bookQid = ? 
       AND (member_id = ? 
         OR (JSON_CONTAINS(authorId, JSON_QUOTE(?)) 
             AND fullController = 'active'))`,
      [bookQid, member_id, authorQid]
    );

    if (books.length === 0) {
      return res.status(403).json({
        message: "Unauthorized: You don’t have permission to edit this book.",
        Result: "False",
      });
    }

    const oldBook = books[0];
    let bookCoverUrl = oldBook.bookCover;
    let bookFileUrl = oldBook.bookFile;

    // --- Step 2: Handle file uploads ---
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

    // --- Step 3: Get body data ---
    const {
      title, subTitle, summary, author, authorId, mainCategory, genre, language,
      pageCount, ISBN10, ISBN13, publisher, publishDate, comment,
      download, share, fullController
    } = req.body;

    const authorJson = JSON.stringify(JSON.parse(author || "[]"));
    const authorIdJson = JSON.stringify(JSON.parse(authorId || "[]"));

    // --- Step 4: Update the book ---
    await db.query(
      `UPDATE uploadBook 
       SET title=?, subTitle=?, summary=?, author=?, authorId=?, mainCategory=?, genre=?, language=?, 
           pageCount=?, ISBN10=?, ISBN13=?, publisher=?, publishDate=?, comment=?, download=?, share=?, 
           bookCover=?, bookFile=?, fullController=?
       WHERE bookQid=?`,
      [
        title, subTitle, summary, authorJson, authorIdJson, mainCategory, genre, language,
        pageCount, ISBN10, ISBN13, publisher, publishDate, comment, download, share,
        bookCoverUrl, bookFileUrl, fullController, bookQid
      ]
    );

    res.json({ message: "Book updated successfully", Result: "True" });

  } catch (error) {
    console.error("updateBookController.js Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { updateBook };


