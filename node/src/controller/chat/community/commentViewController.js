const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");

const displayPostById = async (req, res) => {
  try {
    const  {postId} = req.params;
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
       WHERE c.message_id = ?`,
      [postId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "Post not found" });
    }

    const row = rows[0];
    const post = {
      ...row,
      createFormNow: dayjs(row.created_at).fromNow(),
      media_url: row.media_url ? JSON.parse(row.media_url) : null,
      media_type: row.media_type ? JSON.parse(row.media_type) : null
    };
    res.json(post);
  } catch (err) {
    console.error("displayPostById error:", err.message);
    res.status(500).json({
      status: false,
      error: err.message
    });
  }
};


const displayAllComment = async (req,res)=>{
  try{
    const  {postId} = req.params;
    const [rows] = await db.query(
      `SELECT  
          c.comment_id,
          c.comment_text AS comment, 
          c.media_type,
          c.media_url,
          c.like_count,
          c.reply_count,
          c.memberQid, 
          c.comment_at,
          u.username
       FROM community_post_comment c
       JOIN users u ON c.memberQid = u.memberQid
       WHERE c.message_id = ? AND c.deleted_at IS NULL
       ORDER BY c.comment_at ASC`, 
       [postId]
    );
    const comments = rows.map(row => ({
          ...row,
          createFormNow: dayjs(row.comment_at).fromNow(),
        }));
        res.json(comments);
  }
  catch(err){
      console.error("displayAllComment error:", err.message);
      res.status(500).json({
      status: false,
      error: err.message
  })
}
}
const sendComment = async (req,res)=>{
    try{
      const memberQid = req.user.memberQid;
          const username = req.user.username;
          const { commentText, postId} = req.body;
      
          console.log("sendMessage called", { memberQid, commentText, file: req.file?.originalname });
      
          let mediaType = null;
          let mediaUrl = null;
      
          if (req.file) {
          console.log("File detected:", req.file.originalname, req.file.mimetype);
      
        if (req.file.mimetype.startsWith("image/")) mediaType = "image";
        else if (req.file.mimetype.startsWith("video/")) mediaType = "video";
      
        try {
          mediaUrl = await uploadToS3(req.file, "community_comment/"); 
          if (!mediaUrl) {
            throw new Error("S3 upload failed, no URL returned");
          }
          console.log("S3 upload URL:", mediaUrl);
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          return res.status(500).json({ error: "Failed to upload media", details: uploadErr.message });
        }
      }
      
      
         if (!commentText && !mediaUrl &&!postId) {
        return res.status(400).json({ error: "comment or media is required" });
      }
      
          const [result] = await db.query(
            "INSERT INTO community_post_comment (message_id, memberQid, comment_text, media_type, media_url) VALUES (?, ?, ?, ?, ?)",
            [postId, memberQid, commentText || null, mediaType, mediaUrl]
          );
      
          const msgObj = {
            comment_id: result.insertId,
            memberQid,
            username,
            commentText: commentText || "",
            media_type: mediaType,
            media_url: mediaUrl,
            createFormNow: "just now",
            like_count: 0
          };
      
          console.log("Message saved to DB:", msgObj);
      
          res.json(msgObj);
    }
    catch(err){
        console.error("sendComment error:", err.message);
        res.status(500).json({
        status: false,
        error: err.message
    });
    }
}

const editComment = async (req,res)=>{
    try{
       const memberQid = req.user.memberQid;
          const { comment_id, newComment } = req.body;
      
          const [rows] = await db.query(
            "SELECT memberQid FROM community_post_comment WHERE comment_id = ? AND deleted_at IS NULL",
            [comment_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "Comment not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to edit this comment" });
      
          await db.query(
            "UPDATE community_post_comment SET comment_text = ?, update_at = NOW() WHERE comment_id = ?",
            [newComment, comment_id]
          );
          res.json({ comment_id, newComment });
    }
    catch(err){
        console.error("editComment error:", err.message);
        res.status(500).json({
        status: false,
        error: err.message
    });
    }
}

const deleteComment = async (req,res)=>{
    try{
      const memberQid = req.user.memberQid;
          const { comment_id } = req.body;
      
          const [rows] = await db.query(
            "SELECT memberQid, media_url FROM community_post_comment WHERE comment_id = ? AND deleted_at IS NULL",
            [comment_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "Cooment not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to delete this Comment" });
      
          // delete media from S3
          if (rows[0].media_url) await deleteFromS3(rows[0].media_url);
      
          await db.query("DELETE FROM community_post_comment WHERE comment_id = ?", [comment_id]);
      
          res.json({ comment_id });
    }
    catch(err){
        console.error("deleteComment error:", err.message);
        res.status(500).json({
        status: false,
        error: err.message
    });
    }
}


module.exports = {
    displayPostById,
    displayAllComment,
    sendComment,
    editComment,
    deleteComment
}