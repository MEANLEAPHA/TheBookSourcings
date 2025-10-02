const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");


const displayAllReply = async (req,res)=>{
  try{
    const  {typeOfId} = req.params;
    const [rows] = await db.query(
      `SELECT  
          c.reply_id,
          c.reply_text AS reply, 
          c.media_type,
          c.media_url,
          CONCAT('REP', reply_id, 'LY') AS replyQid,
          c.like_count,
          c.reply_count,
          c.memberQid, 
          c.reply_at,
          u.username
       FROM community_post_comment_reply c
       JOIN users u ON c.memberQid = u.memberQid
       WHERE c.replyBackTo_id = ? AND c.deleted_at IS NULL
       ORDER BY c.reply_at ASC`, 
       [typeOfId]
    );
    const replys = rows.map(row => ({
          ...row,
          createFormNow: dayjs(row.reply_at).fromNow(),
        }));
        res.json(replys);
  }
  catch(err){
      console.error("displayAllReply error:", err.message);
      res.status(500).json({
      status: false,
      error: err.message
  })
}
}
const sendReply = async (req,res)=>{
    try{
      const memberQid = req.user.memberQid;
          const username = req.user.username;
          const { replyText, typeOfId} = req.body;
      
          console.log("sendMessage called", { memberQid, replyText, file: req.file?.originalname });
      
          let mediaType = null;
          let mediaUrl = null;
      
          if (req.file) {
          console.log("File detected:", req.file.originalname, req.file.mimetype);
      
        if (req.file.mimetype.startsWith("image/")) mediaType = "image";
        else if (req.file.mimetype.startsWith("video/")) mediaType = "video";
      
        try {
          mediaUrl = await uploadToS3(req.file, "community_reply/"); 
          if (!mediaUrl) {
            throw new Error("S3 upload failed, no URL returned");
          }
          console.log("S3 upload URL:", mediaUrl);
        } catch (uploadErr) {
          console.error("S3 upload error:", uploadErr);
          return res.status(500).json({ error: "Failed to upload media", details: uploadErr.message });
        }
      }
      
      
         if (!replyText && !mediaUrl &&!typeOfId) {
        return res.status(400).json({ error: "reply or media is required" });
      }
      
          const [result] = await db.query(
            "INSERT INTO community_post_comment (replyBackTo_id, memberQid, reply_text, media_type, media_url) VALUES (?, ?, ?, ?, ?)",
            [typeOfId, memberQid, replyText || null, mediaType, mediaUrl]
          );
      
          const msgObj = {
            reply_id: result.insertId,
            memberQid,
            username,
            replyText: replyText || "",
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

const editReply = async (req,res)=>{
    try{
       const memberQid = req.user.memberQid;
          const { reply_id, newReply } = req.body;
      
          const [rows] = await db.query(
            "SELECT memberQid FROM community_post_comment_reply WHERE reply_id = ? AND deleted_at IS NULL",
            [reply_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "reply not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to edit this reply" });
      
          await db.query(
            "UPDATE community_post_comment_reply SET reply_text = ?, reply_at = NOW() WHERE reply_id = ?",
            [newReply, reply_id]
          );
          res.json({ reply_id, newReply });
    }
    catch(err){
        console.error("editReply error:", err.message);
        res.status(500).json({
        status: false,
        error: err.message
    });
    }
}

const deleteReply = async (req,res)=>{
    try{
      const memberQid = req.user.memberQid;
          const { reply_id } = req.body;
      
          const [rows] = await db.query(
            "SELECT memberQid, media_url FROM community_post_comment_reply WHERE reply_id = ? AND deleted_at IS NULL",
            [reply_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "reply not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to delete this reply" });
      
          // delete media from S3
          if (rows[0].media_url) await deleteFromS3(rows[0].media_url);
      
          await db.query("DELETE FROM community_post_comment_reply WHERE reply_id = ?", [reply_id]);
      
          res.json({ reply_id });
    }
    catch(err){
        console.error("deleteReply error:", err.message);
        res.status(500).json({
        status: false,
        error: err.message
    });
    }
}


module.exports = {
    displayAllReply,
    sendReply,
    editReply,
    deleteReply
}