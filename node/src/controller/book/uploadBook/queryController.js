const db = require("../../../config/db");

// --- Get single book by bookQid for update form
const getBookByQid = async (req, res) => {
  try {
    const { bookQid } = req.params;
 
    const memberQid = req.user.memberQid;
    const authorQid = req.user.authorQid;
    if (!bookQid) {
      return res.status(400).json({ message: "Missing bookQid" });
    }

    const [rows] = await db.query(
     `SELECT * 
       FROM uploadBook 
       WHERE bookQid = ? 
       AND (memberQid  = ? 
         OR (JSON_CONTAINS(authorId, JSON_QUOTE(?)) 
             AND fullController = 'active'))`,
      [bookQid, memberQid , authorQid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Book not found or unauthorized" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getBookByQid error:", err.message);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
const getMyBooks = async (req, res) => {
  try {
    const authorQid = req.user.authorQid;

    console.log("Checking books for authorQid:", authorQid);
    if (!authorQid) {
      return res.status(400).json({ message: "Author QID not found in user profile." });
    }

    // const [rows] = await db.query(
    //   `SELECT * FROM uploadBook WHERE JSON_CONTAINS(authorId, JSON_QUOTE(?))`,
    //   [authorQid]
    // );
    const [rows] = await db.query(
  `SELECT * FROM uploadBook WHERE JSON_CONTAINS(authorId, JSON_QUOTE(?))`,
  [authorQid]
);


    console.log("Books found:", rows.length);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No books found for this author." });
    }

    res.status(200).json({ message: "Books retrieved successfully.", books: rows });
  } catch (err) {
    console.error("getMyBooks error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};



module.exports = { getBookByQid, getMyBooks };
