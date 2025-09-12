const express = require("express");
const router = express.Router();
const {getBookById} = require("../../../controller/book/about/aboutOpenLibraryController");


router.get("/:bookId", getBookById);

module.exports = router;