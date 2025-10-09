const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../../middleware/authMiddleware');
const {
  getPostDetailsWithStatus,
  toggleFav,

} = require("../../../../controller/chat/community/communityLike/communityPostFav");

// Get post details + user status
router.get("/status/:messageId", authMiddleware, getPostDetailsWithStatus);

// Toggle like
router.post("/save/:messageId", authMiddleware, toggleFav);



module.exports = router;
