const express = require("express");
const router = express.Router();
const { addBookView } = require("../../../controller/book/bookActivity/viewController");
const {authMiddleware} = require('../../../middleware/authMiddleware');

// POST /api/books/view/:bookId
router.post("/:bookId", authMiddleware, addBookView);

module.exports = router;
 