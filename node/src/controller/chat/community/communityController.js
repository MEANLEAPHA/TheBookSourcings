const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

dayjs.extend(relativeTime);

// 📌 Display all messages
const getAllMessages = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
          c.message_id, 
          c.message_text AS message, 
          c.media_type,
          c.media_url,
          c.memberQid, 
          c.created_at,
          u.username
       FROM community c
       JOIN users u ON c.memberQid = u.memberQid
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at ASC`
    );

    const messages = rows.map(row => ({
      ...row,
      createFormNow: dayjs(row.created_at).fromNow()
    }));

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Send message with optional media
const sendMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { message } = req.body;

    console.log("sendMessage called", { memberQid, message, file: req.file?.originalname });

    let mediaType = null;
    let mediaUrl = null;

    if (req.file) {
  console.log("File detected:", req.file.originalname, req.file.mimetype);

  if (req.file.mimetype.startsWith("image/")) mediaType = "image";
  else if (req.file.mimetype.startsWith("video/")) mediaType = "video";

  try {
    mediaUrl = await uploadToS3(req.file, "community/"); 
    if (!mediaUrl) {
      throw new Error("S3 upload failed, no URL returned");
    }
    console.log("S3 upload URL:", mediaUrl);
  } catch (uploadErr) {
    console.error("S3 upload error:", uploadErr);
    return res.status(500).json({ error: "Failed to upload media", details: uploadErr.message });
  }
}


    if (!message && !mediaUrl) {
      return res.status(400).json({ error: "Message or media required" });
    }

    const [result] = await db.query(
      "INSERT INTO community (memberQid, message_text, media_type, media_url) VALUES (?, ?, ?, ?)",
      [memberQid, message || null, mediaType, mediaUrl]
    );

    const msgObj = {
      message_id: result.insertId,
      memberQid,
      message: message || "",
      media_type: mediaType,
      media_url: mediaUrl,
      createFormNow: "just now",
      like_count: 0
    };

    console.log("Message saved to DB:", msgObj);

    res.json(msgObj);

  } catch (err) {
    console.error("sendMessage unexpected error:", err.stack || err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};


// 📌 Edit message (replace media if new file uploaded)
const editMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { message_id, newText } = req.body;

    const [rows] = await db.query(
      "SELECT memberQid FROM community WHERE message_id = ? AND deleted_at IS NULL",
      [message_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
    if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized" });

    await db.query(
      "UPDATE community SET message_text = ?, updated_at = NOW() WHERE message_id = ?",
      [newText, message_id]
    );

    res.json({ message_id, newText });
  } catch (err) {
    console.error("editMessage error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// 📌 Delete message (also delete media from S3 if exists)
const deleteMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const { message_id } = req.body;

    const [rows] = await db.query(
      "SELECT memberQid, media_url FROM community WHERE message_id = ? AND deleted_at IS NULL",
      [message_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Message not found" });
    if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized" });

    // delete media from S3
    if (rows[0].media_url) await deleteFromS3(rows[0].media_url);

    await db.query("DELETE FROM community WHERE message_id = ?", [message_id]);

    res.json({ message_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllMessages,
  sendMessage,
  editMessage,
  deleteMessage
};
