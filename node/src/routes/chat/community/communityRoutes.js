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
// Send message with multiple photos/videos
// Accepts "media" field (can upload multiple files)
router.post(
  "/send", 
  verifyHttpToken, 
  upload.array("media", 5), // max 5 files
  sendMessage
);


// Edit message
router.put("/edit", verifyHttpToken, editMessage);

// Delete message
router.delete("/delete", verifyHttpToken, deleteMessage);

module.exports = router;
