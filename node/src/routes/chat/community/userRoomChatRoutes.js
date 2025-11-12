const express = require('express');
const router = express.Router();
const { 
    userRoomChatController,
    displayUserFollowing
 
} = require("../../../controller/chat/community/userRoomChatController");

const {authMiddleware} = require('../../../middleware/authMiddleware');


router.get("/displayUserChatIcon", authMiddleware, userRoomChatController);
router.get("/displayUserFollowing", authMiddleware, displayUserFollowing);

module.exports = router;