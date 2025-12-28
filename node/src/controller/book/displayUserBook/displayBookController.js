const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

const displayAllBook = async (req, res) => {
  try {
    // Join uploadBook with users to get username
    const [existingBook] = await db.query(`
      SELECT 
        b.bookQid,
        b.author,
        b.bookCover,
        b.title,
        b.subTitle,
        b.mainCategory,
        b.genre,
        b.viewCount,
        b.UploadAt,
        u.username
      FROM uploadBook b
      JOIN users u ON b.memberQid = u.memberQid
      ORDER BY b.UploadAt DESC
    `);

    if (!existingBook || existingBook.length === 0) {
      return res.status(404).json({
        message: "No user upload books found",
        result: false,
      });
    }

    // Format result
    const books = existingBook.map(
        (book) => (
            {
      bookQid: book.bookQid,
      author: book.author || "",
      cover: book.bookCover,
      title: book.title,
      subtitle: book.subTitle,
      category: book.mainCategory,
      genre: book.genre,
      view: book.viewCount,
      username: book.username,
      uploaded: dayjs(book.UploadAt).fromNow(), 
            }
        )
    );

    return res.status(200).json({
      message: "Books fetched successfully",
      result: true,
      data: books,
    });
  } catch (err) {
    console.error("displayBookController.js error:", err.message);
    res.status(500).json({
      message:
        "Internal server error. Our team is working to fix it as soon as possible. Sorry!",
      error: err.message,
    });
  }
};

const userBookByMemberQid = async (req, res) => {
  try {
    const { memberQid } = req.params;

    // Join uploadBook with users to get username
    const [existingBook] = await db.query(`
      SELECT 
        b.bookQid,
        b.author,
        b.bookCover,
        b.title,
        b.subTitle,
        b.mainCategory,
        b.genre,
        b.viewCount,
        b.UploadAt,
        u.username
      FROM uploadBook b
      JOIN users u ON b.memberQid = u.memberQid
      WHERE b.memberQid = ?
      ORDER BY b.UploadAt DESC
    `, [memberQid]);

    if (!existingBook || existingBook.length === 0) {
      return res.status(404).json({
        message: "No user upload books found",
        result: false,
      });
    }

    // Format result
    const books = existingBook.map((book) => (
            {
      bookQid: book.bookQid,
      author: book.author || "",
      cover: book.bookCover,
      title: book.title,
      subtitle: book.subTitle,
      category: book.mainCategory,
      genre: book.genre,
      view: book.viewCount,
      username: book.username,
      uploaded: dayjs(book.UploadAt).fromNow(), // e.g., "5 minutes ago"
            }
        )
    );

    return res.status(200).json({
      message: "Books fetched successfully",
      result: true,
      data: books,
    });
  } catch (err) {
    console.error("displayBookController.js error:", err.message);
    res.status(500).json({
      message:
        "Internal server error. Our team is working to fix it as soon as possible. Sorry!",
      error: err.message,
    });
  }
};

module.exports = { displayAllBook, userBookByMemberQid};
