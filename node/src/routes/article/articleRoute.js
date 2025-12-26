const express = require("express");
const router = express.Router();
const { 
publishArticle
} = require("../../controller/article/articleController");
const verifyHttpToken = require("../../middleware/verifyHttpToken");
const { upload } = require("../../../middleware/AWSuploadMiddleware");
router.post(
  '/upload',
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'section_images', maxCount: 3 }
  ]),
  verifyHttpToken,
  publishArticle
);

module.exports = router;