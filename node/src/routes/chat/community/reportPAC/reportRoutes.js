const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');

const {report} = require('../../../../controller/chat/community/reportPAC/reportController')


router.post('/report', authMiddleware, report);

module.exports = router;