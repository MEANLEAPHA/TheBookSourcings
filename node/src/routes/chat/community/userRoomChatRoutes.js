const express = require('express');
const router = express.Router();
const { 
    userRoomChatController
 
} = require("../../../controller/chat/community/userRoomChatController");

const {authMiddleware} = require('../../../middleware/authMiddleware');


router.get("/displayUserChatIcon", authMiddleware, userRoomChatController);

module.exports = router;