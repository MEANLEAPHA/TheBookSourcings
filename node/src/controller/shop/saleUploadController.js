const db = require("../../config/db");
const { uploadToS3, deleteFromS3 } = require("../../middleware/AWSuploadMiddleware");

const saleUpload = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const userEmail = req.user.email;

    const {
      bookTitle,
      description,
      originalPrice,
      price,
      discountType,
      discountPrice,
      saleType,
      bookType,
      qty,
      bookQuality,
      contact,
      website
    } = req.body;

    if (!bookTitle || !originalPrice || !saleType || !qty || !bookQuality || !bookType) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (!req.files?.bookImg || !req.files?.bookFile) {
      return res.status(400).json({ message: "Book image and file are required" });
    }

    // Upload files to S3
    const bookImgUrl = await uploadToS3(req.files.bookImg[0], "BookSale/");
    const bookFileUrl = await uploadToS3(req.files.bookFile[0], "BookSale/");

    let imgPreviewUrl = [];
    if (req.files.imgPreview?.length) {
      imgPreviewUrl = await Promise.all(
        req.files.imgPreview.map(file => uploadToS3(file, "BookSale/"))
      );
    }

    try {
      const [result] = await db.query(
        `INSERT INTO bookForSale 
        (memberQid, vendor_email, title, description, original_price, price, discount_type, discount_price, bookImg, sale_type, book_type, imgPreview, bookFile, qty, quality, contact, website)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          memberQid,
          userEmail,
          bookTitle,
          description,
          originalPrice,
          price,
          discountType,
          discountPrice,
          bookImgUrl,
          saleType,
          bookType,
          JSON.stringify(imgPreviewUrl),
          bookFileUrl,
          qty,
          bookQuality,
          contact,
          website
        ]
      );

      res.status(201).json({
        message: "Book uploaded successfully!",
        data: {
          bookId: result.insertId,
          title: bookTitle,
          img: bookImgUrl,
          previews: imgPreviewUrl
        }
      });
    } catch (dbError) {
      // Rollback uploaded files if DB insertion fails
      await deleteFromS3(bookImgUrl);
      await deleteFromS3(bookFileUrl);
      for (const url of imgPreviewUrl) {
        await deleteFromS3(url);
      }
      throw dbError;
    }
  } catch (error) {
    console.error("saleUploadController error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = { saleUpload };
