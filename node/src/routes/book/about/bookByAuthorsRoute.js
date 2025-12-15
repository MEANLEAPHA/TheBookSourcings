const express = require("express");
const router = express.Router();
const { bookByAuthor, bookByAuthorByQid } = require("../../../controller/book/about/bookByAuthor");
const {authMiddleware} = require("../../../middleware/authMiddleware");
const { 
    uploadRate,
    updateRate,
    deleteRate,
    getUserRate,
    getAllRate,
    displayAllReply,
    deleteReply,
    editReply,
    sendReply,
    getReviewDetailsWithStatus,
    toggleReviewLike,
    getReplyDetailsWithStatus,
    toggleReplyLike,
    reportReview,
    reportReply,
    rateBook,
    getUserRating,
    getRatingSummary
} = require("../../../controller/book/about/allAboutAuthorInfo");
// GET /api/books/bookByAuthor?authorName=MeanLeap Ha
router.get("/:authorName", bookByAuthor);

// GET /api/books/bookByAuthor?authorName=MeanLeap Ha
router.get("/ByQid/:authorQid", bookByAuthorByQid);

// rate route
router.post("/rating", authMiddleware, uploadRate);
router.put("/rating/edit", authMiddleware, updateRate);
router.delete("/rating/delete", authMiddleware, deleteRate);
router.get("/rating/getuserRate/:bookQid", authMiddleware, getUserRate);
router.get("/rating/displayAll/:bookQid", getAllRate);

// rate like route

// Get comment details + user status
router.get("/rating/status/:commentId", authMiddleware, getReviewDetailsWithStatus);
// Toggle like
router.post("/rating/like/:commentId", authMiddleware, toggleReviewLike);


// rate reply route
router.get("/rating/reply/dipslayAll/:typeOfQid", displayAllReply);
router.post("/rating/reply", authMiddleware, sendReply);
router.put("/rating/reply/edit", authMiddleware, editReply);
router.delete("/rating/reply/delete", authMiddleware,deleteReply );

// rate reply like route


router.get("/rating/reply/status/:replyId", authMiddleware, getReplyDetailsWithStatus);

// Toggle like
router.post("/rating/reply/like/:replyId", authMiddleware, toggleReplyLike);

// report
router.post("/rating/report", authMiddleware, reportReview);
router.post("/rating/reply/report", authMiddleware, reportReply);


// star rate
router.post("/rating/star", authMiddleware, rateBook);
router.get("/rating/getUserRating/:bookQid", authMiddleware, getUserRating);



//sum Rate
router.get("/rating/summary/:bookQid", getRatingSummary);


module.exports = router; 
