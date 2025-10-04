const express = require("express");
const router = express.Router();
const { 
   
    displayAllReply,
    sendReply,
    editReply,
    deleteReply
} = require("../../../controller/chat/community/replyController");
const verifyHttpToken = require("../../../middleware/verifyHttpToken");
const { upload } = require("../../../middleware/AWSuploadMiddleware");


// Get one post by id

router.get("/dipslayAllReplys/:typeOfQid", displayAllReply);
router.post(
    "/reply",
    verifyHttpToken,
    upload.single("media"),
    sendReply
);
router.put("/edit/reply", verifyHttpToken, editReply);
router.delete("/delete/reply", verifyHttpToken,deleteReply );

module.exports = router;