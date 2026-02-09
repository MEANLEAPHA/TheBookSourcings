const express = require('express');
const { getAllTrending, getFeed } = require('../../../controller/book/trending/trendingController');
// const {   authMiddleware } = require('../../../middleware/authMiddleware');
const router = express.Router();


router.get('/trending', getAllTrending);


router.get('/feed',  getFeed);

// Export the router using CommonJS
module.exports = router;