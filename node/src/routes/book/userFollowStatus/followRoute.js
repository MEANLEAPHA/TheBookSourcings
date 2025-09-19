const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../../../middleware/authMiddleware');
const {
  getFollowDetailsWithStatus,
  toggleFollow
} = require("../../../controller/book/userFollowStatus/followController");

// Get book details + user status
router.get("/followStatus/:memberQid", authMiddleware, getFollowDetailsWithStatus);

// Toggle like
router.post("/channel/follow/:memberQid", authMiddleware, toggleFollow);

// Toggle favorite


module.exports = router;
