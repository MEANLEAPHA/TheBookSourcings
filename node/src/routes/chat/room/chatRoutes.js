const express = require('express');
const router = express.Router();

const chatController = require('../../../controller/chat/room/chatController');
const { authMiddleware } = require("../../../middleware/authMiddleware");

router.get("/rooms", authMiddleware, chatController.getUserChatRooms);
router.get("/:roomId", authMiddleware, chatController.getChatMessages);
router.get("/:roomId", authMiddleware, chatController.getLastMessage);
router.put("/archive/:roomId", authMiddleware, chatController.archiveRoom);
router.put("/unarchive/:roomId", authMiddleware, chatController.unarchiveRoom);
router.put("/delete/:roomId", authMiddleware, chatController.softDeleteRoom);


module.exports = router;