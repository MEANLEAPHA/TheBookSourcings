const db = require("../../config/db");

// const uploadToS3 = require('../utils/s3'); // optional

const publishArticle = async (req, res) => {
  try {
    const { title } = req.body;
    const memberQid = req.user.memberQid;

    let sectionTexts = req.body.section_texts || [];
    let sectionLayouts = req.body.section_layouts || [];

    if (!Array.isArray(sectionTexts)) sectionTexts = [sectionTexts];
    if (!Array.isArray(sectionLayouts)) sectionLayouts = [sectionLayouts];

    // ------------------------
    // MAIN IMAGE
    // ------------------------
    let mainImageUrl = null;
    if (req.files.main_image) {
      const file = req.files.main_image[0];
      // mainImageUrl = await uploadToS3(file);
      mainImageUrl = `uploads/${Date.now()}-${file.originalname}`;
    }

    // ------------------------
    // SECTION IMAGES
    // ------------------------
    const sectionImages = new Array(sectionLayouts.length).fill(null);
    let imageIndex = 0;

    if (req.files.section_images) {
      for (let i = 0; i < sectionLayouts.length; i++) {
        if (sectionLayouts[i] !== 'no-image') {
          const file = req.files.section_images[imageIndex];
          if (file) {
            // const url = await uploadToS3(file);
            const url = `uploads/${Date.now()}-${file.originalname}`;
            sectionImages[i] = url;
            imageIndex++;
          }
        }
      }
    }

    // ------------------------
    // SAVE TO DB
    // ------------------------
    await db.query(
      `INSERT INTO articles 
        (memberQid, title, main_image, section_texts, section_images, section_layouts)
       VALUES (?,?, ?, ?, ?, ?)`,
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