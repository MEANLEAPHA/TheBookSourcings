const {displayAllBook} = require('../../../controller/book/displayUserBook/displayBookController');

const express = require("express");
const router = express.Router();

router.get("/displayUserUploadBook", displayAllBook);

module.exports = router;