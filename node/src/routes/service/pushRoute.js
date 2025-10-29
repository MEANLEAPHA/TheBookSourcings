
const express = require('express');
const router = express.Router();
const pushController = require('../../controller/service/pushController');
const { authMiddleware } = require('../../middleware/authMiddleware');


router.get("/vapidPublicKey", authMiddleware, (req, res) => {
  // returns { publicKey: process.env.VAPID_PUBLIC_KEY }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', authMiddleware, pushController.subscribe);
router.post('/unsubscribe', authMiddleware, pushController.unsubscribe);

module.exports = router;
