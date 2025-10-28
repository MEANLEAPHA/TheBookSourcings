
const express = require('express');
const router = express.Router();
const pushController = require('../../controller/service/pushController');
const { authMiddleware } = require('../../middleware/authMiddleware');

router.post('/subscribe', authMiddleware, pushController.subscribe);
router.post('/unsubscribe', authMiddleware, pushController.unsubscribe);

module.exports = router;
