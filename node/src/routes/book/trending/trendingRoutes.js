const express = require('express');
const { getAllTrending, getFeed } = require('../../../controller/book/trending/trendingController');
const { authMiddleware, optionalAuth } = require('../../../middleware/authMiddleware');
const router = express.Router();

// GET /api/trending - optional auth (guests allowed)
router.get('/trending', optionalAuth, authMiddleware, getAllTrending);

// GET /api/feed - optional auth (guests allowed)
router.get('/feed', optionalAuth, authMiddleware, getFeed);

// Export the router using CommonJS
module.exports = router;