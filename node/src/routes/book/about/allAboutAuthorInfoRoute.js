const express = require("express");
const router = express.Router();
const {  getAuthorInfo } = require("../../../controller/book/about/allAboutAuthorInfo");

// Endpoint: /api/author/full/:source/:bookId
router.get("/:authorNames", getAuthorInfo);

module.exports = router;
