const {displayAllBook,userBookByMemberQid} = require('../../../controller/book/displayUserBook/displayBookController');

const express = require("express");
const router = express.Router();

router.get("/displayUserUploadBook", displayAllBook);
router.get("/userBookByMemberQid/:memberQid", userBookByMemberQid);

module.exports = router;