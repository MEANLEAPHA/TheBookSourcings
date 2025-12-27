const db = require("../../config/db");

// const uploadToS3 = require('../utils/s3'); // optional

const publishArticle = async (req, res) => {
  try {
    const { title } = req.body;
    const memberQid = req.user.memberQid;

    /* =========================
       SECTION TEXTS & LAYOUTS
    ========================= */
    let sectionTexts = req.body.section_texts || [];
    let sectionLayouts = req.body.section_layouts || [];

    if (!Array.isArray(sectionTexts)) sectionTexts = [sectionTexts];
    if (!Array.isArray(sectionLayouts)) sectionLayouts = [sectionLayouts];

    /* =========================
       MAIN IMAGE (REQUIRED)
    ========================= */
    if (!req.files?.main_image?.length) {
      return res.status(400).json({ error: 'Main image is required' });
    }

    const mainImageFile = req.files.main_image[0];

    // ✅ Upload to S3
    const mainImageUrl = await uploadToS3(
      mainImageFile,
      'articles/main'
    );

    /* =========================
       OPTIONAL SECTION IMAGES (POOL)
       MAX 3
    ========================= */
    const sectionImages = [];
    const optionalImages = req.files.section_images || [];

    for (const file of optionalImages.slice(0, 3)) {
      const url = await uploadToS3(
        file,
        'articles/sections'
      );
      sectionImages.push(url);
    }

    /* =========================
       SAVE TO DB (YOUR SCHEMA)
    ========================= */
    await db.query(
      `INSERT INTO articles 
       (memberQid, title, main_image, section_texts, section_images, section_layout)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        memberQid,
        title,
        mainImageUrl,
        JSON.stringify(sectionTexts),
        JSON.stringify(sectionImages),
        JSON.stringify(sectionLayouts)
      ]
    );

    res.json({
      success: true,
      message: 'Article published successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Publish failed' });
  }
};


module.exports = { publishArticle };