// controllers/bookController.js
const { deleteFromS3 } = require("../../middleware/AWSuploadMiddleware"); // path to your middleware

// DELETE S3 file endpoint
const deleteBookFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: "fileUrl is required" });
    }

    await deleteFromS3(fileUrl);

    return res.status(200).json({
      success: true,
      message: "Book file deleted from S3 successfully",
    });
  } catch (err) {
    console.error("❌ deleteBookFile error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete file from S3" });
  }
};

module.exports = { deleteBookFile };
