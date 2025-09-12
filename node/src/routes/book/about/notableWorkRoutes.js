const express = require("express");
const router = express.Router();
const { getAuthorNotableWorks } = require("../../../controller/book/about/notableWorkcontroller");
// GET /api/books/similar?category=History
router.get("/:wikiId", getAuthorNotableWorks);


module.exports = router;
