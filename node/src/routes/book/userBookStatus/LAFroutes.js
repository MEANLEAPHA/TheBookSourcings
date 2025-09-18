const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../middleware/authMiddleware');
const {
  getBookDetailsWithStatus,
  toggleLike,
  toggleFavorite
} = require("../../../controller/book/userBookStatus/LAFcontroller");

// Get book details + user status
router.get("/status/:bookId", authMiddleware, getBookDetailsWithStatus);

// Toggle like
router.post("/like/:bookId", authMiddleware, toggleLike);

// Toggle favorite
router.post("/favorite/:bookId", authMiddleware, toggleFavorite);

module.exports = router;
