const express = require("express");
const router = express.Router();
const { 
    displayPostById,
    displayAllComment,
    sendComment,
    editComment,
    deleteComment
} = require("../../../controller/chat/community/commentViewController");
const verifyHttpToken = require("../../../middleware/verifyHttpToken");
const { upload } = require("../../../middleware/AWSuploadMiddleware");


// Get one post by id
router.get("/display/:postId", displayPostById);
router.get("/dipslayAllComments/:postId", displayAllComment);
router.post(
    "/comment",
    verifyHttpToken,
    upload.single("media"),
    sendComment
);
router.put("/edit/comment", verifyHttpToken, editComment);
router.delete("/delete/comment", verifyHttpToken,deleteComment );

module.exports = router;