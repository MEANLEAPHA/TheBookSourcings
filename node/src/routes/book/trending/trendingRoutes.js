// Import dependencies using require
const express = require('express');
const { getAllTrending } = require('../../../controller/book/trending/trendingController');

const router = express.Router();

// GET /api/trending
router.get('/', getAllTrending);

// Export the router using CommonJS
module.exports = router;
