const { fetchJson } = require("../../../util/apiClient");

const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

async function getAuthorInfoByQid(req, res) {
  try {
    const {authorQid} = req.params;
    if (!authorQid) {
      return res.status(400).json({ error: "Author QID required" });
    }

    // Split QIDs (example: "Q123,Q456,Q789")
    const authorQids = authorQid.split(",");

    // Make SQL placeholders: (?, ?, ?, ...)
    const placeholders = authorQids.map(() => "?").join(",");

    // Query DB
    const [rows] = await db.query(
      `SELECT *
       FROM users 
       WHERE authorQid IN (${placeholders})`,
      authorQids
    );

    // If no authors found
    if (!rows || rows.length === 0) {
      return res.json({ authors: [] });
    }

    // Return in frontend-compatible format
    res.json({ authors: rows });
  } catch (err) {
    console.error("getAuthorInfoByQid error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info by QID" });
  }
};




// --- Search Wikidata by author name
async function fetchWikidataId(name) {
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&origin=*`;
  const data = await fetchJson(searchUrl);
  if (data.search && data.search.length > 0) return data.search[0].id;
  return null;
}

// --- Fetch Wikidata entity by QID
async function fetchWikidataEntity(qid) {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const data = await fetchJson(url);
  return data.entities[qid];
}

// --- Get label (human-readable) for a Wikidata QID
async function fetchWikidataLabel(qid) {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const data = await fetchJson(url);
    return data.entities[qid]?.labels?.en?.value || qid; // fallback to QID if no label
  } catch (err) {
    console.error("fetchWikidataLabel error:", err.message);
    return qid;
  }
}

// --- Main controller
async function getAuthorInfo(req, res) {
  try {
    const authorNamesParam = req.params.authorNames;
    if (!authorNamesParam) return res.status(400).json({ error: "Author names required" });

    const authorNames = authorNamesParam.split(",");

    const results = await Promise.all(
      authorNames.map(async (name) => {
        let wikidataId = await fetchWikidataId(name);
        let description = "No description available";
        let profession = "";
        let photo = "";

        if (wikidataId) {
          try {
            const entity = await fetchWikidataEntity(wikidataId);
            description = entity.descriptions?.en?.value || entity.labels?.en?.value || description;

            // Profession (P106) → can be array of items
            if (entity.claims?.P106 && entity.claims.P106.length > 0) {
              const professionQid = entity.claims.P106[0].mainsnak.datavalue.value.id;
              profession = await fetchWikidataLabel(professionQid); // 🔹 convert QID → label
            }

            // Image (P18)
            if (entity.claims?.P18 && entity.claims.P18.length > 0) {
              photo = entity.claims.P18[0].mainsnak.datavalue.value || "";
            }
          } catch (err) {
            console.error(`Wikidata fetch error for ${name}:`, err.message);
          }
        }

        return { name, description, profession, photo, wikidataId: wikidataId || "" };
      })
    );

    res.json({ authors: results });
  } catch (err) {
    console.error("getAuthorInfo error:", err.message);
    res.status(500).json({ error: "Failed to fetch author info" });
  }
}







async function getUserRate(req,res){
  const { bookQid } = req.params;
  const memberQid = req.user.memberQid;
  try {
     const [rows] = await db.query(
      'SELECT * FROM book_rating WHERE bookQid = ? AND memberQid = ?',
      [bookQid, memberQid]
    );
    if (rows.length === 0) {
      return res.json({ message: 'No rating found' });
    }
    res.json(rows[0]);
  }
  catch(err){
    console.error("getUserRate error:", err.message);
    res.status(500).json({ error: "Failed to fetch getUserRate" });
  }
}

async function getAllRate(req,res){
  const { bookQid } = req.params;
  try {
     const [rows] = await db.query(
      ` SELECT
          b.rate_id AS comment_id,
          b.review_text AS comment,
          CONCAT('COMM', b.rate_id, 'ENT') AS commentQid,
          b.like_count,
          b.reply_count,
          b.memberQid,
          b.created_at,
          b.username,
          u.pfUrl AS profile_url
        FROM book_rating b
        JOIN users u ON b.memberQid = u.memberQid
        WHERE b.bookQid = ? ORDER BY b.created_at ASC`,
        [bookQid]
      );
    if (rows.length === 0) {
      return res.json([]);   // IMPORTANT FIX
    }
    const comments = rows.map(row => ({
          ...row,
          createFormNow: dayjs(row.created_at).fromNow(),
        }));
        res.json(comments);
  }
  catch(err){
    console.error("getAllRate error:", err.message);
    res.status(500).json({ error: "Failed to fetch getAllRate" });
  }
}
async function uploadRate(req,res){

  try{
      const {bookQid, review_text } = req.body;
      const memberQid = req.user.memberQid;
      // const nickname = req.user.nickname;
      const username = req.user.username;
    // Check if user already rated this book
    // const [existing] = await db.query(
    //   'SELECT * FROM book_rating WHERE bookQid = ? AND memberQid = ?',
    //   [bookQid, memberQid]
    // );

    // if (existing.length > 0) {
    //   return res.status(400).json({ message: 'User already rated this book. Use update instead.' });
    // }

    if (!review_text && !bookQid) {
        return res.status(400).json({ error: "Review or Rating is required" });
      }

    const [result] = await db.query(
      'INSERT INTO book_rating (bookQid, memberQid, username, nickname, review_text) VALUES (?, ?, ?, ?, ?)',
      [bookQid, memberQid, username, null, review_text || null]
    );
    await db.query(
      "UPDATE uploadBook SET review_count = review_count + 1 WHERE bookQid = ?",
      [bookQid]
    );
          const msgObj = {
            comment_id: result.insertId,
            memberQid,
            username,
            comment: review_text || "",
            createFormNow: "just now",
            like_count: 0
          };
      res.json(msgObj);
  }
  catch(err){
    console.error("uploadRate error:", err.message);
    res.status(500).json({ error: "Failed to fetch uploadRate" });
  }
}

async function updateRate(req,res){
    const { comment_id, newComment } = req.body;
    const memberQid = req.user.memberQid;
  try{
    const [rows] = await db.query(
            "SELECT memberQid FROM book_rating WHERE rate_id = ? AND deleted_at IS NULL",
            [comment_id]
      );
      
          if (rows.length === 0) return res.status(404).json({ error: "Review not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to edit this Review" });
    await db.query(
      'UPDATE book_rating SET review_text = ?, updated_at = NOW() WHERE rate_id = ?',
      [ newComment || null, comment_id]
    );
    res.json({ comment_id, newComment});
  }
  catch(err){
    console.error("updateRate error:", err.message);
    res.status(500).json({ error: "Failed to fetch updateRate" });
  }
}

async function deleteRate(req,res){
  const { comment_id } = req.body;
  const memberQid = req.user.memberQid;
  try {
    const [rows] = await db.query(
            "SELECT memberQid, bookQid FROM book_rating WHERE rate_id = ?",
            [comment_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "review not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to delete this Review" });

    await db.query('DELETE FROM book_rating WHERE rate_id = ?', [comment_id]);
    await db.query(
            "UPDATE uploadBook SET review_count = GREATEST(review_count - 1, 0) WHERE bookQid = ?",
            [rows[0].bookQid]
          );
    res.json({ comment_id });
  }
  catch(err){
    console.error("deleteRate error:", err.message);
    res.status(500).json({ error: "Failed to fetch deleteRate" });
  }
}

const displayAllReply = async (req,res)=>{
  try{
    const  {typeOfQid} = req.params;
    const [rows] = await db.query(
      `SELECT  
          reply_id,
          reply_text AS reply, 
          CONCAT('REP', reply_id, 'LY') AS replyQid,
          like_count,
          reply_count,
          memberQid, 
          created_at,
          replyBackTo_id, 
          username,
          (
            CASE 
              WHEN replyBackTo_id LIKE 'REP%LY' THEN 
                (SELECT u2.username
                FROM book_rating_reply cr
                JOIN users u2 ON cr.memberQid = u2.memberQid
                WHERE CONCAT('REP', cr.reply_id, 'LY') = replyBackTo_id
                LIMIT 1)
              WHEN replyBackTo_id LIKE 'COMM%ENT' THEN
                (SELECT u3.username
                FROM book_rating cc
                JOIN users u3 ON cc.memberQid = u3.memberQid
                WHERE CONCAT('COMM', cc.rate_id, 'ENT') = replyBackTo_id
                LIMIT 1)
              ELSE NULL
            END
          ) AS replyToUsername
       FROM book_rating_reply WHERE replyBackTo_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`, 
       [typeOfQid]
    );
    const replys = rows.map(row => ({
          ...row,
          createFormNow: dayjs(row.created_at).fromNow(),
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
          // const nickname = req.user.nickname;
          const { replyText, typeOfId} = req.body;
         if (!replyText &&!typeOfId) {
          return res.status(400).json({ error: "reply is required" });
        }
      
          const [result] = await db.query(
            "INSERT INTO book_rating_reply (replyBackTo_id, memberQid, reply_text, nickname, username) VALUES (?, ?, ?, ?, ?)",
            [typeOfId, memberQid, replyText || null, null, username]
          );
          // Find username of the person being replied to
          let [targetRows] = [];
          if (typeOfId.startsWith("COMM")) {
            [targetRows] = await db.query(
              `SELECT username FROM book_rating WHERE rate_id = ?`,
              [parseInt(typeOfId.replace("COMM", "").replace("ENT", ""))]
            );
          } else if (typeOfId.startsWith("REP")) {
            [targetRows] = await db.query(
              `SELECT username FROM book_rating_reply WHERE reply_id = ?`,
              [parseInt(typeOfId.replace("REP", "").replace("LY", ""))]
            );
          }

          const replyToUsername = targetRows[0]?.username || null;


          // Update parent reply_count if replying to a reply
          if (typeOfId.startsWith("REP")) {
            const parentReplyId = parseInt(typeOfId.replace("REP", "").replace("LY", ""));
            await db.query(
              "UPDATE book_rating_reply SET reply_count = reply_count + 1 WHERE reply_id = ?",
              [parentReplyId]
            );
          }
          // If replying to a comment, increment reply_count
        if (typeOfId.startsWith("COMM")) {
          const commentId = parseInt(typeOfId.replace("COMM", "").replace("ENT", ""));
          await db.query(
            "UPDATE book_rating SET reply_count = reply_count + 1 WHERE rate_id = ?",
            [commentId]
          );
        } 
          const msgObj = {
            reply_id: result.insertId,
            memberQid,
            username,
            replyToUsername,
            reply: replyText || "",
            createFormNow: "just now",
            like_count: 0,
            replyBackTo_id: typeOfId 
          };
     
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
            "SELECT memberQid FROM book_rating_reply WHERE reply_id = ? AND deleted_at IS NULL",
            [reply_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "reply not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to edit this reply" });
      
          await db.query(
            "UPDATE book_rating_reply SET reply_text = ?, created_at = NOW() WHERE reply_id = ?",
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
            "SELECT memberQid FROM book_rating_reply WHERE reply_id = ? AND deleted_at IS NULL",
            [reply_id]
          );
      
          if (rows.length === 0) return res.status(404).json({ error: "reply not found" });
          if (rows[0].memberQid !== memberQid) return res.status(403).json({ error: "Not authorized to delete this reply" });
      
          await db.query("DELETE FROM book_rating_reply WHERE reply_id = ?", [reply_id]);

          // If reply was to a reply, decrement parent reply's reply_count
          if (replyBackToId.startsWith("REP")) {
            const parentReplyId = parseInt(replyBackToId.replace("REP", "").replace("LY", ""));
            await db.query(
              "UPDATE book_rating_reply SET reply_count = GREATEST(reply_count - 1, 0) WHERE reply_id = ?",
              [parentReplyId]
            );
          }
          // If reply was to a comment, decrement reply_count
          const replyBackToId = rows[0].replyBackTo_id;
          if (replyBackToId.startsWith("COMM")) {
            const commentId = parseInt(replyBackToId.replace("COMM", "").replace("ENT", ""));
            await db.query(
              "UPDATE book_rating SET reply_count = GREATEST(reply_count - 1, 0) WHERE rate_id = ?",
              [commentId]
            );
          }
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

const getReviewDetailsWithStatus = async (req, res) => {
  try {
    const { commentId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT like_count FROM book_rating WHERE rate_id = ?",
      [commentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "review not found" });
    }
    const comment= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT liked FROM book_rating_like WHERE memberQid = ? AND rate_id = ?",
      [memberQid, commentId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { liked: 0 };


    res.json({
      comment,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getCommentDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleReviewLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT liked FROM book_rating_like WHERE memberQid = ? AND rate_id = ?",
      [memberQid, commentId]
    );

    let liked = 0;
 
    if (rows.length > 0) {
      liked = rows[0].liked ? 0 : 1;
      await db.query(
        "UPDATE book_rating_like SET liked = ?, updated_at = NOW() WHERE memberQid = ? AND rate_id = ?",
        [liked, memberQid, commentId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO book_rating_like (memberQid, rate_id, liked) VALUES (?, ?, 1)",
        [memberQid,commentId]
      );
    }

    // Update community like_count
    await db.query(
      "UPDATE book_rating SET like_count = (SELECT COUNT(*) FROM book_rating_like WHERE rate_id = ? AND liked = 1) WHERE rate_id = ?",
      [commentId, commentId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleCommentLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const getReplyDetailsWithStatus = async (req, res) => {
  try {
    const { replyId } = req.params;
    const memberQid = req.user.memberQid;

    // Book info
    const [rows] = await db.query(
      "SELECT like_count FROM book_rating_reply WHERE reply_id = ?",
      [replyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "reply not found" });
    }
    const reply= rows[0];

    // User status
    const [statusRows] = await db.query(
      "SELECT liked	 FROM book_rating_reply_like WHERE memberQid = ? AND reply_id = ?",
      [memberQid, replyId]
    );

    const status = statusRows.length > 0 ? statusRows[0] : { liked: 0 };

    res.json({
      reply,
      userStatus: status
    });
  } catch (err) {
    console.error("Error in getReplyDetailsWithStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Toggle like
const toggleReplyLike = async (req, res) => {
  try {
    const { replyId } = req.params;
    const memberQid = req.user.memberQid;

    // Check current status
    const [rows] = await db.query(
      "SELECT liked FROM book_rating_reply_like WHERE memberQid = ? AND reply_id = ?",
      [memberQid, replyId]
    );

    let liked = 0;
 
    if (rows.length > 0) {
      liked = rows[0].liked ? 0 : 1;
      await db.query(
        "UPDATE book_rating_reply_like SET liked = ?, updated_at = NOW() WHERE memberQid = ? AND reply_id = ?",
        [liked, memberQid, replyId]
      );
    } else {
      liked = 1;
      await db.query(
        "INSERT INTO book_rating_reply_like (memberQid, reply_id, liked) VALUES (?, ?, 1)",
        [memberQid, replyId]
      );
    }

    // Update community_post_comment_reply like_count
    await db.query(
      "UPDATE book_rating_reply SET like_count = (SELECT COUNT(*) FROM book_rating_reply_like WHERE reply_id = ? AND liked = 1) WHERE reply_id = ?",
      [replyId, replyId]
    );

    res.json({ liked });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const reportReview =  async (req, res) =>{
    try{
    
         const memeberQid = req.user.memberQid;
         const {reasonCommentTxt,comment_id} = req.body;
        
         const [result] = await db.query(
            "INSERT INTO book_rating_report (memberQid, reason_text, rate_id) VALUES(?,?,?)",
            [memeberQid, reasonCommentTxt, comment_id]
        )
        res.json(
            {
                message : 'ThankYou for your report, Our team will working on that.',
                status : true,
                reportId: result.insertId,
            }
        );
    }
    catch(err){
        console.error(err);
        res.status(500).json(
            {
                error: err.message,
                status: false
            }
        )
    }
}

const reportReply =  async (req, res) =>{
    try{
    
         const memeberQid = req.user.memberQid;
         const {reasonReplyTxt,reply_id} = req.body;
        
         const [result] = await db.query(
            "INSERT INTO book_rating_reply_report (memberQid, reason_text, reply_id) VALUES(?,?,?)",
            [memeberQid, reasonReplyTxt, reply_id]
        )
        res.json(
            {
                message : 'ThankYou for your report, Our team will working on that.',
                status : true,
                reportId: result.insertId,
            }
        );
    }
    catch(err){
        console.error(err);
        res.status(500).json(
            {
                error: err.message,
                status: false
            }
        )
    }
}

// ⭐ Upload or Update rating
const rateBook = async (req, res) => {
  try {
    const { bookQid, rate_star} = req.body;
    const memberQid = req.user.memberQid; 
    const username = req.user.username;
  

    if (!bookQid || !rate_star) {
      return res.status(400).json({ message: "Missing rating data" });
    }

    // Check if rating exists already
    const [existing] = await db.query(
      "SELECT * FROM star_ratings WHERE bookQid = ? AND memberQid = ?",
      [bookQid, memberQid]
    );

    if (existing.length > 0) {
      // ⭐ UPDATE rating
      await db.query(
        "UPDATE star_ratings SET rate_star = ? WHERE bookQid = ? AND memberQid = ?",
        [rate_star, bookQid, memberQid]
      );
      return res.json({ message: "Rating updated", rate_star });
    }

    // ⭐ INSERT new rating
    await db.query(
      "INSERT INTO star_ratings (bookQid, rate_star, memberQid, username) VALUES (?, ?, ?, ?)",
      [bookQid, rate_star, memberQid, username]
    );

    return res.json({ message: "Rating submitted", rate_star });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// ⭐ Display previous user rating for a book
const getUserRating = async (req, res) => {
  try {
    const { bookQid } = req.params;
    const memberQid = req.user.memberQid;

    const [rows] = await db.query(
      "SELECT rate_star FROM star_ratings WHERE bookQid = ? AND memberQid = ?",
      [bookQid, memberQid]
    );

    if (rows.length === 0) {
      return res.json({ rate_star: 0 }); // no rating yet
    }

    return res.json({ rate_star: rows[0].rate_star });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

    module.exports = {
      getAuthorInfo,
      getAuthorInfoByQid,
      uploadRate,
      updateRate,
      deleteRate,
      getUserRate,
      getAllRate,
      displayAllReply,
      deleteReply,
      editReply,
      sendReply,
      getReviewDetailsWithStatus,
      toggleReviewLike,
      getReplyDetailsWithStatus,
      toggleReplyLike,
      reportReview,
      reportReply,
      rateBook,
      getUserRating
    };
