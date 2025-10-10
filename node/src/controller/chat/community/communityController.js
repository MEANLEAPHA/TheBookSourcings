
const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

dayjs.extend(relativeTime);

// 📌 Display all messages
// const getAllMessages = async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT 
//           c.message_id, 
//           c.message_text AS message, 
//           c.feeling,
//           c.media_type,
//           c.media_url,
//           c.like_count,
//           c.comment_count,
//           c.repost_count,
//           c.memberQid, 
//           c.created_at,
//           u.username
//        FROM community c
//        JOIN users u ON c.memberQid = u.memberQid
//        WHERE c.deleted_at IS NULL
//        ORDER BY c.created_at ASC`
//     );
 
//     const messages = rows.map(row => ({
//       ...row,
//       createFormNow: dayjs(row.created_at).fromNow(),
//       media_url: row.media_url ? JSON.parse(row.media_url) : [],
//       media_type: row.media_type ? JSON.parse(row.media_type) : []
//     }));

//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
const getAllMessages = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          c.message_id, 
          c.message_text AS message, 
          c.feeling,
          c.media_type,
          c.media_url,
          c.like_count,
          c.comment_count,
          c.repost_count,
          c.repost_id,
          c.memberQid, 
          c.created_at,
          u.username
       FROM community c
       JOIN users u ON c.memberQid = u.memberQid
       WHERE c.deleted_at IS NULL
       ORDER BY c.created_at DESC
    `);

    const messages = await Promise.all(rows.map(async row => {
      let repostData = null;

      // If this message is a repost, get the original post info
      if (row.repost_id) {
        const [repostRows] = await db.query(`
          SELECT 
              c.message_id,
              c.message_text AS repostText, 
              c.feeling,
              c.media_type,
              c.media_url,
              c.memberQid,
              c.created_at,
              u.username
           FROM community c
           JOIN users u ON c.memberQid = u.memberQid
           WHERE c.message_id = ?
        `, [row.repost_id]);

         if (repostRows.length > 0) {
          const repost = repostRows[0];
          repostData = {
            message_id: repost.message_id,
            message: repost.repostText,
            feeling: repost.feeling,
            media_type: repost.media_type ? JSON.parse(repost.media_type) : [],
            media_url: repost.media_url ? JSON.parse(repost.media_url) : [],
            memberQid: repost.memberQid,
            username: repost.username,
            createFormNow: dayjs(repost.created_at).fromNow(), // 👈 Add this
          };
        }
      }

      return {
        message_id: row.message_id,
        message: row.message,
        feeling: row.feeling,
        media_type: row.media_type ? JSON.parse(row.media_type) : [],
        media_url: row.media_url ? JSON.parse(row.media_url) : [],
        like_count: row.like_count,
        comment_count: row.comment_count,
        repost_count: row.repost_count,
        repost_id: row.repost_id,
        repostData, 
        username: row.username,
        memberQid: row.memberQid,
        createFormNow: dayjs(row.created_at).fromNow()
      };
    }));

    res.json(messages);
  } catch (err) {
    console.error("getAllMessages error:", err);
    res.status(500).json({ error: err.message });
  }
};



// 📌 Send message with multiple media
const sendMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const username = req.user.username;
    const { message, feeling, repost_id } = req.body;

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

    if (!message && mediaUrls.length === 0 && !feeling && !repost_id) {
      return res.status(400).json({ error: "Message, media, repost content,or feeling required" });
    }

    const [result] = await db.query(
      "INSERT INTO community (memberQid, message_text, feeling, repost_id, media_type, media_url) VALUES (?, ?, ?, ?, ?, ?)",
      [memberQid, message || null, feeling || null, repost_id, JSON.stringify(mediaTypes), JSON.stringify(mediaUrls)]
    );

     
    // Fetch repost info if repost_id exists
    let repostData = null;
    if (repost_id) {
      const [rows] = await db.query(
        `SELECT 
            c.message_id,
            c.message_text AS repostText, 
            c.feeling,
            c.memberQid, 
            c.media_type,
            c.media_url,
            c.created_at,
            u.username
         FROM community c
         JOIN users u ON c.memberQid = u.memberQid
         WHERE c.message_id = ?`,
        [repost_id]
      );

      if (rows.length > 0) {
        repostData = rows[0];
        // ✅ Parse JSON fields
        repostData.media_url = repostData.media_url
          ? JSON.parse(repostData.media_url)
          : [];
        repostData.media_type = repostData.media_type
          ? JSON.parse(repostData.media_type)
          : [];
      }
    }

    const msgObj = {
      message_id: result.insertId,
      memberQid,
      username,
      feeling,
      message: message || "",
      media_type: mediaTypes,
      media_url: mediaUrls,
      createFormNow: "just now",
      like_count: 0,
      repostData 
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
