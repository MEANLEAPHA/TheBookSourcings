
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
          c.feeling,
          c.media_type,
          c.media_url,
          c.like_count,
          c.comment_count,
          c.repost_count,
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
      createFormNow: dayjs(row.created_at).fromNow(),
      media_url: row.media_url ? JSON.parse(row.media_url) : [],
      media_type: row.media_type ? JSON.parse(row.media_type) : []
    }));

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 📌 Send message with multiple media
const sendMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const username = req.user.username;
    const { message, feeling } = req.body;

    let mediaUrls = [];
    let mediaTypes = [];

    // Support multiple file uploads (req.files instead of req.file)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let type = null;
        if (file.mimetype.startsWith("image/")) type = "image";
        else if (file.mimetype.startsWith("video/")) type = "video";

        const url = await uploadToS3(file, "community/");
        mediaUrls.push(url);
        mediaTypes.push(type);
      }
    }

    if (!message && mediaUrls.length === 0 && !feeling) {
      return res.status(400).json({ error: "Message, media, or feeling required" });
    }

    const [result] = await db.query(
      "INSERT INTO community (memberQid, message_text, feeling, media_type, media_url) VALUES (?, ?, ?, ?, ?)",
      [memberQid, message || null, feeling || null, JSON.stringify(mediaTypes), JSON.stringify(mediaUrls)]
    );

    const msgObj = {
      message_id: result.insertId,
      memberQid,
      username,
      feeling,
      message: message || "",
      media_type: mediaTypes,
      media_url: mediaUrls,
      createFormNow: "just now",
      like_count: 0
    };

    res.json(msgObj);
  } catch (err) {
    console.error("sendMessage error:", err);
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
// 📌 Delete message (also delete multiple media from S3 if exists)
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

    // delete each media URL from S3 if exists
    if (rows[0].media_url) {
      let mediaUrls = [];
      try {
        mediaUrls = JSON.parse(rows[0].media_url);
      } catch (err) {
        console.warn("Failed to parse media_url JSON:", err);
      }

      for (const url of mediaUrls) {
        if (url) {
          try {
            await deleteFromS3(url);
          } catch (err) {
            console.error("Failed to delete S3 file:", url, err);
          }
        }
      }
    }

    // delete message from DB
    await db.query("DELETE FROM community WHERE message_id = ?", [message_id]);

    res.json({ message_id });
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllMessages,
  sendMessage,
  editMessage,
  deleteMessage
};
