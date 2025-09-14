const express = require("express");
const router = express.Router();

const { getBookByQid } = require("../../../controller/book/uploadBook/queryController");
const { authMiddleware } = require('../../../middleware/authMiddleware');



// Get all books for dashboard
router.put("/:bookQid", authMiddleware,getBookByQid);

module.exports = router;






