const express = require("express");
const router = express.Router();
const { 
  getAllMessages, 
  getAllMessagesByMemberQid,
  sendMessage, 
  editMessage, 
  deleteMessage ,
  shareBook
} = require("../../../controller/chat/community/communityController");
const verifyHttpToken = require("../../../middleware/verifyHttpToken");
const { upload } = require("../../../middleware/AWSuploadMiddleware");

// Get all messages
router.get("/display", getAllMessages);
router.get("/display/:memberQid", getAllMessagesByMemberQid);
// Send message with optional photo/video
// Accepts "media" field (image or video file)
// Send message with multiple photos/videos
// Accepts "media" field (can upload multiple files)
router.post(
  "/send", 
  verifyHttpToken, 
  upload.fields([
    { name: "media", maxCount: 5 },
    { name: "quote_bg_url", maxCount: 1 }
  ]),
  // upload.array("media", 5), 
  sendMessage
);

router.post('/share', verifyHttpToken, shareBook);

// Edit message
router.put("/edit", verifyHttpToken, editMessage);

// Delete message
router.delete("/delete", verifyHttpToken, deleteMessage);

module.exports = router;
