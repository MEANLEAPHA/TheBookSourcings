const express = require("express");
const router = express.Router();
const {  getFullAuthorInfo } = require("../../../controller/book/about/allAboutAuthorInfo");

// Endpoint: /api/author/full/:source/:bookId
router.get("/full/:source/:bookId", getFullAuthorInfo);

module.exports = router;
