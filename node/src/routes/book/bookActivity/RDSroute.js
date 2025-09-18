// routes/bookActivityRoutes.js
const express = require("express");
const router = express.Router();
const {authMiddleware} = require('../../../middleware/authMiddleware');
const { recordActivity } = require("../../../controller/book/bookActivity/RDScontroller");

// :type → view, read, download, share
router.post("/:type/:bookId", authMiddleware, recordActivity);

module.exports = router;
