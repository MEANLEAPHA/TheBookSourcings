const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');
const {
  getReplyDetailsWithStatus,
  toggleLike,
 
} = require("../../../../controller/chat/community/communityLike/communityReplyLike");

// Get book details + user status
router.get("/status/:replyId", authMiddleware, getReplyDetailsWithStatus);

// Toggle like
router.post("/like/:replyId", authMiddleware, toggleLike);


module.exports = router;
