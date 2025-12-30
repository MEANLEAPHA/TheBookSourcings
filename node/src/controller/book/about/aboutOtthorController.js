const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(relativeTime);

const getOtthorById = async (req, res) => {
  try {
    const { bookId } = req.params;

    // Join uploadBook with users to get uploader username
    const [rows] = await db.query(
      `SELECT 
        b.bookQid,
        b.memberQid,
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
        u.authorQid,
        u.memberQid,
        u.pfUrl,
        u.followerCount
      FROM uploadBook b
      JOIN users u ON b.memberQid = u.memberQid
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
      pfUrl : bookRow.pfUrl,
      followerCount : bookRow.followerCount,
      bookQid: bookRow.bookQid,
      title: bookRow.title,
      subtitle: bookRow.subTitle,
      author: bookRow.author,
      authorIds : bookRow.authorQid,
      author_id: bookRow.authorId,
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

module.exports = { getOtthorById };
