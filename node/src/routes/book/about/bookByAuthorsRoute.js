const express = require("express");
const router = express.Router();
const { bookByAuthor } = require("../../../controller/book/about/bookByAuthor");
// GET /api/books/bookByAuthor?authorName=MeanLeap Ha
router.get("/:authorName", bookByAuthor);


module.exports = router;
