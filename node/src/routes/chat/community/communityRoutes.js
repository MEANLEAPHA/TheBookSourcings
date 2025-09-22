const express = require("express");
const router = express.Router();
const { getAllMessages, sendMessage, editMessage, deleteMessage } = require("../../../controller/chat/community/communityController");
const  verifyHttpToken = require("../../../middleware/verifyHttpToken"); // JWT middleware

router.get("/display", verifyHttpToken, getAllMessages);
router.post("/send", verifyHttpToken, sendMessage);
router.put("/edit", verifyHttpToken, editMessage);
router.delete("/delete", verifyHttpToken, deleteMessage);

module.exports = router;
