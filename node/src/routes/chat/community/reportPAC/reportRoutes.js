const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');

const {report, reportComment, reportReply} = require('../../../../controller/chat/community/reportPAC/reportController')

// POST 
router.post('/report', authMiddleware, report);
// Comment
router.post('/reportComment', authMiddleware, reportComment);

router.post('/reportReply', authMiddleware, reportReply);

module.exports = router;