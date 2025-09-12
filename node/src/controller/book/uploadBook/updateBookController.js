const updateBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const { title, subtitle, author, summary, category, genre, language, pageCount, isnb10, isnb13, publisher, publishedDate, comment, download, share } = req.body;

    const member_id = req.user.user_id;

  
    // Ensure the task belongs to the authenticated user
    const [existingBook] = await db.query(
      "SELECT * FROM updloadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (existingBook.length === 0) {
      return res.status(403).json(
            { 
            message: "Unauthorized or Book not found",
            Result: "False" }
        );
    }

    const [result] = await db.query(
      `UPDATE updloadBook 
       SET title = ?, subTitle = ?, author = ?, summary = ?, mainCategory = ?, genre = ?, language = ?, pageCount = ? , ISBN10= ?, ISBN13= ? , publisher = ?, publishDate= ? , comment= ?, download = ?, share = ? 
       WHERE bookQid = ? AND member_id = ?`,
      [title, subtitle, author, summary, category, genre, language, pageCount, isnb10, isnb13, publisher, publishedDate, comment, download, share, bookQid, member_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(
        { message: "Book not updated" }
    );
    }

   
    

    res.json(
        { message: "Book updated successfully",}
    );

  } catch (error) {
    console.error("updateBookController.js Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { updateBook};