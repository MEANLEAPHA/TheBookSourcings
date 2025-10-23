const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../../middleware/authMiddleware");
const {
  getFollowDetailsWithStatus,
  toggleFollow,
  followBackController,
  getFollowNotifications,
  getFollowers,
  getFollowing
} = require("../../../controller/book/userFollowStatus/followLogic");

// =====================
// Follow Status
// =====================

// Get user details + follow status
router.get("/followStatus/:followedQid", authMiddleware, getFollowDetailsWithStatus);

// Toggle follow/unfollow (normal follow)
router.post("/channel/follow/:followedQid", authMiddleware, toggleFollow);

// =====================
// Follow Back
// =====================

// Follow back a user (current user follows back someone who followed them)
router.post("/followBack/:followerQid", authMiddleware, followBackController);

// =====================
// Notifications
// =====================

// Get follow notifications for current user
router.get("/follow/notifications", authMiddleware, getFollowNotifications);

router.get("/followers", authMiddleware, getFollowers);
router.get("/following", authMiddleware, getFollowing);

module.exports = router;
