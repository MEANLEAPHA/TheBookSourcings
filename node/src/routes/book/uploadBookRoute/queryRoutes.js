const express = require("express");
const router = express.Router();

const { getMyBooks, } = require("../../../controller/book/uploadBook/queryController");
const { authMiddleware } = require('../../../middleware/authMiddleware');



// Get all books for dashboard
router.get("/notableWork", authMiddleware,getMyBooks);


module.exports = router;






