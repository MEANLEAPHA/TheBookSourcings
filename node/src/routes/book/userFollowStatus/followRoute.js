const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../middleware/authMiddleware');
const {
  getFollowDetailsWithStatus,
  toggleFollow
} = require("../../../controller/book/userFollowStatus/followController");

// Get book details + user status
router.get("/followStatus/:followedQid", authMiddleware, getFollowDetailsWithStatus);

// Toggle follow
router.post("/channel/follow/:followedQid", authMiddleware, toggleFollow);




module.exports = router;
