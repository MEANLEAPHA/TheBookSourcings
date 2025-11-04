const express = require('express');
const router = express.Router();

const chatController = require('../../../controller/chat/room/chatController');
const { authMiddleware } = require("../../../middleware/authMiddleware");

router.get("/rooms", authMiddleware, chatController.getUserChatRooms);
router.get("/:roomId", authMiddleware, chatController.getChatMessages);

router.put("/archive/:roomId", authMiddleware, chatController.archiveRoom);
router.put("/unarchive/:roomId", authMiddleware, chatController.unarchiveRoom);
router.put("/delete/:roomId", authMiddleware, chatController.softDeleteRoom);
// GET /api/chat/unreadRooms
router.get("/unreadRooms", authMiddleware, async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const rows = await chatController.getUnreadRoomsForMember(memberQid);
    // rows: [{ roomId, unreadCount, lastMessageId }]
    res.json({ ok: true, rooms: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});
// DELETE /api/chat/unreadRooms/:roomId
router.delete("/unreadRooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const roomId = req.params.roomId;
    await chatController.clearUnreadForMember(roomId, memberQid);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});




module.exports = router;