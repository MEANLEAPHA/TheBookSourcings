const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');
const {
  getCommentDetailsWithStatus,
  toggleCommentLike,

} = require("../../../../controller/chat/community/communityLike/communityCommentLike");

// Get comment details + user status
router.get("/status/:commentId", authMiddleware, getCommentDetailsWithStatus);

// Toggle like
router.post("/like/:commentId", authMiddleware, toggleCommentLike);



module.exports = router;
