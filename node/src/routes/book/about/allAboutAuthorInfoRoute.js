const express = require("express");
const router = express.Router();
const {  getAuthorInfo, getAuthorInfoByQid } = require("../../../controller/book/about/allAboutAuthorInfo");

// Endpoint: /api/author/full/:source/:bookId
router.get("/:authorNames", getAuthorInfo);

// Endpoint: /api/author/full/:source/:bookId
router.get("/ByQid/:authorQid", getAuthorInfoByQid);

module.exports = router;
