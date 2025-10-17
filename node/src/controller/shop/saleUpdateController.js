// const db = require("../../config/db");
// const { uploadToS3, deleteFromS3 } = require("../../middleware/AWSuploadMiddleware");

// const updateBookForSale = async (req, res) => {
//   try {
//     const { bookSid } = req.params;
//     const memberQid = req.user.memberQid;

//     const [books] = await db.query(
//       "SELECT * FROM bookForsale WHERE bookSid = ? AND memberQid = ?",
//       [bookSid, memberQid]
//     );

//     if (books.length === 0) {
//       return res.status(403).json({
//         message: "Unauthorized or Book not found",
//         Result: "False",
//       });
//     }

//     const oldBook = books[0];
//     let bookImgUrl = oldBook.bookImg;
//     let bookFileUrl = oldBook.bookFile;
//     let imgPreviewUrls = [];

//     try {
//       imgPreviewUrls = oldBook.imgPreview ? JSON.parse(oldBook.imgPreview) : [];
//     } catch {
//       imgPreviewUrls = [];
//     }

//     if (req.files?.bookImg && req.files.bookImg[0]) {
//       const newImg = await uploadToS3(req.files.bookImg[0], "BookSale/");
//       if (oldBook.bookImg) await deleteFromS3(oldBook.bookImg);
//       bookImgUrl = newImg;
//     }

//     if (req.files?.bookFile && req.files.bookFile[0]) {
//       const newFile = await uploadToS3(req.files.bookFile[0], "BookSale/");
//       if (oldBook.bookFile) await deleteFromS3(oldBook.bookFile);
//       bookFileUrl = newFile;
//     }

//     if (req.files?.imgPreview && req.files.imgPreview.length > 0) {

//       for (const url of imgPreviewUrls) {
//         if (url) {
//           try { await deleteFromS3(url); } catch (err) {
//             console.warn("Failed to delete old preview:", url, err);
//           }
//         }
//       }

//       imgPreviewUrls = [];
//       for (const file of req.files.imgPreview) {
//         const url = await uploadToS3(file, "BookSale/");
//         imgPreviewUrls.push(url);
//       }
//     }

//     const {
//       bookTitle,
//       description,
//       originalPrice,
//       price,
//       discountType,
//       discountPrice,
//       saleType,
//       bookType,
//       qty,
//       bookQuality,
//       contact,
//       website
//     } = req.body;

//     await db.query(
//       `UPDATE bookForsale SET 
//         title = ?, 
//         description = ?, 
//         original_price = ?, 
//         price = ?, 
//         discount_type = ?, 
//         discount_price = ?, 
//         sale_type = ?, 
//         book_type = ?,
//         qty = ?, 
//         quality = ?, 
//         contact = ?, 
//         website = ?, 
//         bookImg = ?, 
//         imgPreview = ?, 
//         bookFile = ?
//       WHERE bookSid = ? AND memberQid = ?`,
//       [
//         bookTitle,
//         description,
//         originalPrice,
//         price,
//         discountType,
//         discountPrice,
//         saleType,
//         bookType,
//         qty,
//         bookQuality,
//         contact,
//         website,
//         bookImgUrl,
//         JSON.stringify(imgPreviewUrls),
//         bookFileUrl,
//         bookSid,
//         memberQid,
//       ]
//     );

//     res.json({
//       message: "Book updated successfully",
//       Result: "True",
//     });
//   } catch (error) {
//     console.error("updateBookForSale.js Error:", error);
//     res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// module.exports = { updateBookForSale };
const db = require("../../config/db");
const { uploadToS3, deleteFromS3 } = require("../../middleware/AWSuploadMiddleware");

const updateBookForSale = async (req, res) => {
  try {
    const { bookSid } = req.params;
    const memberQid = req.user.memberQid;

    // 🔍 Fetch old data
    const [books] = await db.query(
      "SELECT * FROM bookForsale WHERE bookSid = ? AND memberQid = ?",
      [bookSid, memberQid]
    );

    if (books.length === 0) {
      return res.status(403).json({
        message: "Unauthorized or Book not found",
        Result: "False",
      });
    }

    const oldBook = books[0];

    let bookImgUrl = oldBook.bookImg || null;
    let bookFileUrl = oldBook.bookFile || null;
    let imgPreviewUrls = [];

    try {
      imgPreviewUrls = oldBook.imgPreview ? JSON.parse(oldBook.imgPreview) : [];
    } catch {
      imgPreviewUrls = [];
    }

    // ⚙️ Replace main book image
    if (req.files?.bookImg?.[0]) {
      console.log("🖼️ Replacing main book image...");
      const newImg = await uploadToS3(req.files.bookImg[0], "BookSale/");
      if (oldBook.bookImg) await deleteFromS3(oldBook.bookImg);
      bookImgUrl = newImg;
    }

    // ⚙️ Replace book file (only if ebook)
    if (req.files?.bookFile?.[0]) {
      console.log("📄 Replacing book file...");
      const newFile = await uploadToS3(req.files.bookFile[0], "BookSale/");
      if (oldBook.bookFile) await deleteFromS3(oldBook.bookFile);
      bookFileUrl = newFile;
    }

    // ⚙️ Replace image previews (if new ones uploaded)
    if (req.files?.imgPreview?.length > 0) {
      console.log("🖼️ Replacing preview images...");
      for (const url of imgPreviewUrls) {
        if (url) {
          try {
            await deleteFromS3(url);
          } catch (err) {
            console.warn("⚠️ Failed to delete old preview:", url, err.message);
          }
        }
      }

      imgPreviewUrls = [];
      for (const file of req.files.imgPreview) {
        const url = await uploadToS3(file, "BookSale/");
        imgPreviewUrls.push(url);
      }
    }

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
      website,
    } = req.body;

    // 🧱 Validate some required fields
    if (!bookTitle || !saleType || !bookType || !qty) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 💾 Update DB
    await db.query(
      `UPDATE bookForsale SET 
        title = ?, 
        description = ?, 
        original_price = ?, 
        price = ?, 
        discount_type = ?, 
        discount_price = ?, 
        sale_type = ?, 
        book_type = ?,
        qty = ?, 
        quality = ?, 
        contact = ?, 
        website = ?, 
        bookImg = ?, 
        imgPreview = ?, 
        bookFile = ?
      WHERE bookSid = ? AND memberQid = ?`,
      [
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
        website,
        bookImgUrl,
        JSON.stringify(imgPreviewUrls),
        bookFileUrl,
        bookSid,
        memberQid,
      ]
    );

    console.log("✅ Book updated successfully:", bookSid);
    res.json({ message: "Book updated successfully", Result: "True" });
  } catch (error) {
    console.error("💥 updateBookForSale Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = { updateBookForSale };
