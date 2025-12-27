const express = require("express");
const router = express.Router();
const { 
publishArticle
} = require("../../controller/article/articleController");
const {authMiddleware} = require("../../middleware/authMiddleware");
const { upload } = require("../../middleware/AWSuploadMiddleware");
router.post(
  '/upload',
   upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'section_images', maxCount: 3 }
  ]),
  authMiddleware,
  publishArticle
);

module.exports = router;