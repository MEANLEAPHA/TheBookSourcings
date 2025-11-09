const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../../middleware/authMiddleware");
const {
  getFollowDetailsWithStatus,
  toggleFollow,
  followBackController,
  getFollowNotifications,
  getFollowers,
  getFollowing,
  clearOneNotificationById,
  clearTheNotification,
  getMutual
} = require("../../../controller/book/userFollowStatus/followLogic");

router.get("/followStatus/:followedQid", authMiddleware, getFollowDetailsWithStatus);


router.post("/channel/follow/:followedQid", authMiddleware, toggleFollow);




router.post("/followBack/:followerQid", authMiddleware, followBackController);

router.get("/follow/notifications", authMiddleware, getFollowNotifications);
router.delete("/follow/notifications/clearAll", authMiddleware, clearTheNotification);
router.delete("/follow/notifications/clear/:notiId", authMiddleware, clearOneNotificationById);

router.get("/followers", authMiddleware, getFollowers);
router.get("/following", authMiddleware, getFollowing);

router.get("/mutual", authMiddleware, getMutual);

module.exports = router;
