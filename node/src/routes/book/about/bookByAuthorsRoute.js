const express = require("express");
const router = express.Router();
const { bookByAuthor, bookByAuthorByQid } = require("../../../controller/book/about/bookByAuthor");
// GET /api/books/bookByAuthor?authorName=MeanLeap Ha
router.get("/:authorName", bookByAuthor);

// GET /api/books/bookByAuthor?authorName=MeanLeap Ha
router.get("/ByQid/:authorQid", bookByAuthorByQid);


module.exports = router;
