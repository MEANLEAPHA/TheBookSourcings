const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middleware/authMiddleware");
const { upload } = require("../../middleware/AWSuploadMiddleware");

const { saleUpload } = require("../../controller/shop/saleUploadController");
const { updateBookForSale } = require("../../controller/shop/saleUpdateController");
const { deleteBook } = require("../../controller/shop/saleDeleteController");
const { displayBooksForSale, displayBooksBySidForSale, getMySaleBook  } = require("../../controller/shop/saleQueryController");

// 📘 Display all or filtered books for sale
router.get("/displaySaleBook", displayBooksForSale);

router.get("/displaySaleBookBySid/:bookSid", displayBooksBySidForSale);

router.get("/displayUserSaleBook", authMiddleware, getMySaleBook)

// 🆕 Upload a new book for sale
router.post(
  "/uploadSaleBook",
  authMiddleware,
  upload.fields([
    { name: "bookImg", maxCount: 1 },
    { name: "bookFile", maxCount: 1 },
    { name: "imgPreview", maxCount: 5 },
  ]),
  saleUpload
);

// 📝 Update book info
router.put(
  "/updateSaleBook/:bookSid",
  authMiddleware,
  upload.fields([
    { name: "bookImg", maxCount: 1 },
    { name: "bookFile", maxCount: 1 },
    { name: "imgPreview", maxCount: 5 },
  ]),
  updateBookForSale
);

// ❌ Delete a book
router.delete("/deleteSaleBook/:bookSid", authMiddleware, deleteBook);

module.exports = router;
