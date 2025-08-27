const express = require("express");
const router = express.Router();
const { getBookById } = require("../../../controller/book/about/aboutGoogleController");

// just point to controller, no async here
router.get("/:bookId", getBookById);

module.exports = router;
