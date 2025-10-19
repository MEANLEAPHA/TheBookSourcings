const express = require('express');
const router = express.Router();

const chatController = require('../../../controller/chat/room/chatController');


router.get("/:roomId", async (req, res) => {
  try {
    const messages = await chatController.getChatMessages(req.params.roomId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to load chat messages" });
  }
});

module.exports = router;