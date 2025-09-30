const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');

const {report, reportComment} = require('../../../../controller/chat/community/reportPAC/reportController')

// POST 
router.post('/report', authMiddleware, report);
// Comment
router.post('/reportComment', authMiddleware, reportComment);

module.exports = router;