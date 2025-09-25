const express = require("express");
const router = express.Router();
const { 
  getAllMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage 
} = require("../../../controller/chat/community/communityController");
const verifyHttpToken = require("../../../middleware/verifyHttpToken");
const { upload } = require("../../../middleware/AWSuploadMiddleware");

// Get all messages
router.get("/display", getAllMessages);

// Send message with optional photo/video
// Accepts "media" field (image or video file)
router.post(
  "/send", 
  verifyHttpToken, 
  upload.single("media"), // handles one file upload (photo/video)
  sendMessage
);

// Edit message
router.put("/edit", verifyHttpToken, editMessage);

// Delete message
router.delete("/delete", verifyHttpToken, deleteMessage);

module.exports = router;
