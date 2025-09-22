const express = require("express");
const router = express.Router();
const { getAllMessages, sendMessage, editMessage, deleteMessage } = require("../../../controller/chat/community/communityController");
const  verifySocketToken = require("../../../middleware/verifySocketToken"); // JWT middleware

router.get("/", verifySocketToken, getAllMessages);
router.post("/send", verifySocketToken, sendMessage);
router.put("/edit", verifySocketToken, editMessage);
router.delete("/delete", verifySocketToken, deleteMessage);

module.exports = router;
