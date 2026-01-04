// Import dependencies using require
const express = require('express');
const { getAllTrending, getFeed } = require('../../../controller/book/trending/trendingController');

const router = express.Router();

// GET /api/trending
router.get('/trending', getAllTrending);
router.get('/feed', getFeed);

// Export the router using CommonJS
module.exports = router;
