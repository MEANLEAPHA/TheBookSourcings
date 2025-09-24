const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');
const {
  getPostDetailsWithStatus,
  toggleLike,

} = require("../../../../controller/chat/community/communityLike/communityPostLike");

// Get post details + user status
router.get("/status/:messageId", authMiddleware, getPostDetailsWithStatus);

// Toggle like
router.post("/like/:messageId", authMiddleware, toggleLike);



module.exports = router;
