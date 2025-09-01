const express = require("express");
const router = express.Router();
const { getSimilarBooks } = require("../../../controller/book/about/similarBook");
// GET /api/books/similar?category=History
router.get("/:category", getSimilarBooks);


module.exports = router;
