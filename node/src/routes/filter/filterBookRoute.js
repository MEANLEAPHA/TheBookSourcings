
// routes/bookSearch.route.js
const express = require("express");
const router = express.Router();
const { searchBooks } = require("../../controller/filter/filterBook");

router.get("/search", searchBooks);

module.exports = router;
