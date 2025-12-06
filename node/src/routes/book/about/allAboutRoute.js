const express = require("express");
const router = express.Router();
const { allAboutBook } = require("../../../controller/book/about/allAboutBook");

// GET book by source and ID
// Example: /api/books/google/zyTCAlFPjgYC
router.get("/:source/:bookId", allAboutBook);

module.exports = router;


