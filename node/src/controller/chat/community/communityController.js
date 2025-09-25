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

    let mediaType = null;
    let mediaUrl = null;

    // Handle file if uploaded
    if (req.file) {
      if (req.file.mimetype.startsWith("image/")) mediaType = "image";
      else if (req.file.mimetype.startsWith("video/")) mediaType = "video";

      // Upload to S3
      const uploadRes = await uploadToS3(req.file, "community/");
      if (!uploadRes || !uploadRes.Location) {
        return res.status(500).json({ error: "Failed to upload media" });
      }
      mediaUrl = uploadRes.Location;
    }

    // Validate at least one of message or media
    if (!message && !mediaUrl) {
      return res.status(400).json({ error: "Message or media required" });
    }

    // Insert into DB
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

    res.json(msgObj);

  } catch (err) {
    console.error("sendMessage error:", err.message);
    res.status(500).json({ error: err.message });
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
