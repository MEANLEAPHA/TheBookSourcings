const db = require('../../../config/db');
const deleteBook = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const member_id = req.user.user_id;

    if (!bookQid) {
      return res.json(
            { message: "Missing bookQid",
            Result: "False" }
        );
    }

    // Ensure the book belongs to the user
    const [existingBook] = await db.query(
      "SELECT * FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (existingBook.length === 0) {
      return res.status(403).json(
                { message: "Unauthorized or task not found",
                Result: "False" }
            );
    }

    const [result] = await db.query(
      "DELETE FROM uploadBook WHERE bookQid = ? AND member_id = ?",
      [bookQid, member_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(
        { message: "Book can't be deleted, reason: book is unknown",
             Result: "False" }
            );
    }


    res.json(
        { message: "Delete successful"
    }
);

  } catch (error) {
    console.error("deleteBookController.js error in deleteToDo:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {deleteBook} ;