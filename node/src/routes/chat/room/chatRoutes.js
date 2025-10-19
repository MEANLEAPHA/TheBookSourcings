const express = require('express');
const router = express.Router();

const chatController = require('../../../controller/chat/room/chatController');
const { authMiddleware } = require("../../../middleware/authMiddleware");


router.get("/:roomId", authMiddleware, chatController.getChatMessages);

module.exports = router;