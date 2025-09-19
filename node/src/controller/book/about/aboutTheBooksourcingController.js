const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

const getTheBookSourcingById = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Join uploadBook with users to get uploader username
    const [rows] = await db.query(
      `SELECT 
        b.bookQid,
        b.author,
        b.bookCover,
        b.title,
        b.subTitle,
        b.mainCategory,
        b.genre,
        b.viewCount,
        b.UploadAt,
        b.summary,
        b.language,
        b.pageCount,
        b.ISBN10,
        b.ISBN13,
        b.publishDate,
        b.publisher,
        b.bookFile,
        u.username,
        u.memberQid
      FROM uploadBook b
      JOIN users u ON b.member_id = u.user_id
      WHERE b.bookQid = ?`,
      [bookId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: "No user book found",
        result: false,
      });
    }

    const bookRow = rows[0];

    const book = {
      bookQid: bookRow.bookQid,
      title: bookRow.title,
      subtitle: bookRow.subTitle,
      author: bookRow.author,
      description: bookRow.summary,
      cover: bookRow.bookCover,
      categories: bookRow.mainCategory,
      genre: bookRow.genre 
    ? bookRow.genre.split(",").map(g => g.trim()) 
    : [],
      language: bookRow.language,
      page: bookRow.pageCount,
      ISBN_10: bookRow.ISBN10,
      ISBN_13: bookRow.ISBN13,
      publishDate: bookRow.publishDate
    ? new Date(bookRow.publishDate).toLocaleDateString("en-CA") // en-CA gives YYYY-MM-DD
    : null,
      publisher: bookRow.publisher,
      read: bookRow.bookFile,
      download: bookRow.bookFile,
      views: bookRow.viewCount,
      uploaded: dayjs(bookRow.UploadAt).fromNow(), // e.g. "3 days ago"
      username: bookRow.username,
      channel: bookRow.memberQid
    };

    res.json(book);
  } catch (err) {
    console.error("getTheBookSourcingById error:", err.message);
    res.status(500).json({
      message:
        "Internal server error. Our team is working to fix it as soon as possible. Sorry!",
      error: err.message,
    });
  }
};

module.exports = { getTheBookSourcingById };
