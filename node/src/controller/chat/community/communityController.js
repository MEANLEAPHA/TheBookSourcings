
const db = require("../../../config/db");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const { uploadToS3, deleteFromS3 } = require("../../../middleware/AWSuploadMiddleware");
const { fetchJson } = require("../../../util/apiClient");
dayjs.extend(relativeTime);



function detectSourceByBookId(bookId) {
  if (/^TB\d+S$/.test(bookId)) return "otthor";
  if (/^OL\d+(W|M|A)$/.test(bookId)) return "openlibrary";
  if (/^\d+$/.test(bookId)) return "gutenberg";
  if (/^[a-zA-Z0-9_-]{10,}$/.test(bookId)) return "google"; // Google IDs
  return null;
}

async function searchOtthorById(bookQid) {
  const [rows] = await db.query(
    `SELECT bookQid, title, author, summary, bookCover
     FROM uploadBook WHERE bookQid = ? LIMIT 1`,
    [bookQid]
  );

  return mapOtthor(rows);
}
function mapOtthor(rows) {
  return rows.map(b => ({
    bookQid: b.bookQid,
    title: b.title,
    authors: b.author ? b.author.split(",").map(a => a.trim()) : [],
    description: b.summary || null,
    cover: b.bookCover || null,
    source: "otthor"
  }));
}
async function searchGoogleById(id) {
  const data = await fetchJson(
    `https://www.googleapis.com/books/v1/volumes/${id}`
  );

  return [{
    bookQid: data.id,
    title: data.volumeInfo.title,
    authors: data.volumeInfo.authors || [],
    description: data.volumeInfo.description || null,
    cover: data.volumeInfo.imageLinks?.thumbnail || null,
    source: "google"
  }];
}

async function searchOpenLibraryById(id) {
  const data = await fetchJson(
    `https://openlibrary.org/works/${id}.json`
  );

  return [{
    bookQid: id,
    title: data.title,
    authors: data.authors
      ? await Promise.all(
          data.authors.map(async a => {
            const author = await fetchJson(`https://openlibrary.org${a.author.key}.json`);
            return author.name;
          })
        )
      : [],
    description:
      typeof data.description === "string"
        ? data.description
        : data.description?.value || null,
    cover: data.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`
      : null,
    source: "openlibrary"
  }];
}
async function searchGutenbergById(id) {
  const data = await fetchJson(`https://gutendex.com/books/${id}`);

  return [{
    bookQid: data.id,
    title: data.title,
    authors: data.authors.map(a => a.name),
    description: data.summaries?.[0] || null,
    cover: data.formats?.["image/jpeg"] || null,
    source: "gutenberg"
  }];
}
async function fetchBookByQid(bookQid) {
  const source = detectSourceByBookId(bookQid);
  if (!source) return [];

  if (source === "otthor") return await searchOtthorById(bookQid);
  if (source === "openlibrary") return await searchOpenLibraryById(bookQid);
  if (source === "gutenberg") return await searchGutenbergById(bookQid);
  if (source === "google") return await searchGoogleById(bookQid);

  return [];
}
const getAllMessages = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.message_id,
        c.message_text AS message,
        c.feeling,
        c.media_type,
        c.media_url,
        c.repost_bookQid,
        c.quote_text,
        c.quote_by,
        c.quote_font_color,
        c.quote_font_family,
        c.quote_bg_url,
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

    const messages = await Promise.all(
      rows.map(async row => {

        // 🔹 Book attached to main post
        const bookResults = row.repost_bookQid
          ? await fetchBookByQid(row.repost_bookQid)
          : [];

        let repostData = null;

        // 🔹 Repost handling
        if (row.repost_id) {
          const [repostRows] = await db.query(`
            SELECT 
              c.message_id,
              c.message_text AS repostText,
              c.feeling,
              c.repost_bookQid,
              c.quote_text,
              c.quote_by,
              c.quote_font_color,
              c.quote_font_family,
              c.quote_bg_url,
              c.media_type,
              c.media_url,
              c.memberQid,
              c.created_at,
              u.username
            FROM community c
            JOIN users u ON c.memberQid = u.memberQid
            WHERE c.message_id = ?
          `, [row.repost_id]);

          if (repostRows.length) {
            const repost = repostRows[0];

            const repostBookResults = repost.repost_bookQid
              ? await fetchBookByQid(repost.repost_bookQid)
              : [];

            repostData = {
              message_id: repost.message_id,
              message: repost.repostText,
              feeling: repost.feeling,
              results: repostBookResults,
              quote_text: repost.quote_text,
              quote_by: repost.quote_by,
              quote_font_family: repost.quote_font_family,
              quote_font_color: repost.quote_font_color,
              quote_bg_url: repost.quote_bg_url,
              media_type: repost.media_type ? JSON.parse(repost.media_type) : [],
              media_url: repost.media_url ? JSON.parse(repost.media_url) : [],
              memberQid: repost.memberQid,
              username: repost.username,
              createFormNow: dayjs(repost.created_at).fromNow()
            };
          }
        }

        return {
          message_id: row.message_id,
          message: row.message,
          feeling: row.feeling,
          results: bookResults,
          quote_text: row.quote_text,
          quote_by: row.quote_by,
          quote_font_family: row.quote_font_family,
          quote_font_color: row.quote_font_color,
          quote_bg_url: row.quote_bg_url,
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
      })
    );

    res.json(messages);
  } catch (err) {
    console.error("getAllMessages error:", err);
    res.status(500).json({ error: err.message });
  }
};


const getAllMessagesByMemberQid = async (req, res) => {
  try {
    const { memberQid } = req.params;

    const [rows] = await db.query(`
      SELECT 
        c.message_id, 
        c.message_text AS message, 
        c.feeling,
        c.repost_bookQid,
        c.quote_text,
        c.quote_by,
        c.quote_font_color,
        c.quote_font_family,
        c.quote_bg_url,
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
      WHERE c.memberQid = ? AND c.deleted_at IS NULL
      ORDER BY c.created_at DESC
    `, [memberQid]);

    const messages = await Promise.all(
      rows.map(async row => {

        /* ===============================
           🔹 Resolve book for this post
        =============================== */
        const book =
          row.repost_bookQid
            ? (await fetchBookByQid(row.repost_bookQid))[0] || null
            : null;

        let repostData = null;

        /* ===============================
           🔁 If this is a repost
        =============================== */
        if (row.repost_id) {
          const [repostRows] = await db.query(`
            SELECT 
              c.message_id,
              c.message_text AS repostText,
              c.feeling,
              c.repost_bookQid,
              c.quote_text,
              c.quote_by,
              c.quote_font_color,
              c.quote_font_family,
              c.quote_bg_url,
              c.media_type,
              c.media_url,
              c.memberQid,
              c.created_at,
              u.username
            FROM community c
            JOIN users u ON c.memberQid = u.memberQid
            WHERE c.message_id = ?
          `, [row.repost_id]);

          if (repostRows.length) {
            const repost = repostRows[0];

            const repostBook =
              repost.repost_bookQid
                ? (await fetchBookByQid(repost.repost_bookQid))[0] || null
                : null;

            repostData = {
              message_id: repost.message_id,
              message: repost.repostText,
              feeling: repost.feeling,
              results: repostBook, // ✅ resolved from any source
              quote_text: repost.quote_text,
              quote_by: repost.quote_by,
              quote_font_family: repost.quote_font_family,
              quote_font_color: repost.quote_font_color,
              quote_bg_url: repost.quote_bg_url,
              media_type: repost.media_type ? JSON.parse(repost.media_type) : [],
              media_url: repost.media_url ? JSON.parse(repost.media_url) : [],
              memberQid: repost.memberQid,
              username: repost.username,
              createFormNow: dayjs(repost.created_at).fromNow()
            };
          }
        }

        /* ===============================
           📦 Final message payload
        =============================== */
        return {
          message_id: row.message_id,
          message: row.message,
          feeling: row.feeling,
          book, // ✅ resolved via detectSourceByBookId
          quote_text: row.quote_text,
          quote_by: row.quote_by,
          quote_font_family: row.quote_font_family,
          quote_font_color: row.quote_font_color,
          quote_bg_url: row.quote_bg_url,
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
      })
    );

    res.json(messages);

  } catch (err) {
    console.error("getAllMessagesByMemberQid error:", err);
    res.status(500).json({ error: err.message });
  }
};


// const getAllMessagesByMemberQid = async (req, res) => {
//   try {
//     const { memberQid } = req.params;
//     const [rows] = await db.query(`
//       SELECT 
//           c.message_id, 
//           c.message_text AS message, 
//           c.feeling,
//           c.repost_bookQid,
//           c.quote_text,
//           c.quote_by,
//           c.quote_font_color,
//           c.quote_font_family,
//           c.quote_bg_url,
//           c.media_type,
//           c.media_url,
//           c.like_count,
//           c.comment_count,
//           c.repost_count,
//           c.repost_id,
//           c.memberQid, 
//           c.created_at,
//           u.username
//        FROM community c
//        JOIN users u ON c.memberQid = u.memberQid
//        WHERE c.memberQid = ? AND c.deleted_at IS NULL
//        ORDER BY c.created_at DESC
//     `, 
//      [memberQid]
//     );

//     const messages = await Promise.all(rows.map(async row => {
//       let repostData = null;

//       // If this message is a repost, get the original post info
//       if (row.repost_id) {
//         const [repostRows] = await db.query(`
//           SELECT 
//               c.message_id,
//               c.message_text AS repostText, 
//               c.feeling,
//               c.repost_bookQid,
//               c.quote_text,
//               c.quote_by,
//               c.quote_font_color,
//               c.quote_font_family,
//               c.quote_bg_url,
//               c.media_type,
//               c.media_url,
//               c.memberQid,
//               c.created_at,
//               u.username
//            FROM community c
//            JOIN users u ON c.memberQid = u.memberQid
//            WHERE c.message_id = ?
//         `, [row.repost_id]);

//          if (repostRows.length > 0) {
//           const repost = repostRows[0];
//           repostData = {
//             message_id: repost.message_id,
//             message: repost.repostText,
//             feeling: repost.feeling,
//             bookQid: repost.repost_bookQid,
//             quote_text: repost.quote_text,
//             quote_by: repost.quote_by,
//             quote_font_family: repost.quote_font_family,
//             quote_font_color: repost.quote_font_color,
//             quote_bg_url: repost.quote_bg_url,
//             media_type: repost.media_type ? JSON.parse(repost.media_type) : [],
//             media_url: repost.media_url ? JSON.parse(repost.media_url) : [],
//             memberQid: repost.memberQid,
//             username: repost.username,
//             createFormNow: dayjs(repost.created_at).fromNow(), // 👈 Add this
//           };
//         }
//       }

//       return {
//         message_id: row.message_id,
//         message: row.message,
//         feeling: row.feeling,
//         bookQid: row.repost_bookQid,
//         quote_text: row.quote_text,
//         quote_by: row.quote_by,
//         quote_font_family: row.quote_font_family,
//         quote_font_color: row.quote_font_color,
//         quote_bg_url: row.quote_bg_url,
//         media_type: row.media_type ? JSON.parse(row.media_type) : [],
//         media_url: row.media_url ? JSON.parse(row.media_url) : [],
//         like_count: row.like_count,
//         comment_count: row.comment_count,
//         repost_count: row.repost_count,
//         repost_id: row.repost_id,
//         repostData, 
//         username: row.username,
//         memberQid: row.memberQid,
//         createFormNow: dayjs(row.created_at).fromNow()
//       };
//     }));

//     res.json(messages);
//   } catch (err) {
//     console.error("getAllMessages error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
// 📌 Send message with multiple media

const shareBook = async (req, res) => {
  try{
    const memberQid = req.user.memberQid;
    const {bookQid, message, feeling} = req.body;


    const [insertResult] = await db.query(
      `INSERT INTO community (
        memberQid,
        message_text,
        feeling,
        repost_bookQid
      ) VALUES (?, ?, ?, ?)`,
      [
        memberQid,
        message || null,
        feeling || null,
        bookQid,
      ]
    );

    await db.query(
      `INSERT INTO book-share (memberQid, bookQid)`,
      [memberQid, bookQid]
    );
    res.json(insertResult);
  }
  catch (err) {
    console.error("shareBook error:", err);
    res.status(500).json({ error: err.message });
  }
}
const sendMessage = async (req, res) => {
  try {
    const memberQid = req.user.memberQid;
    const username = req.user.username;

    const {
      message,
      feeling,
      repost_id,
      bookQid,
      quote_text,
      quote_by,
      quote_font_family,
      quote_font_color
    } = req.body;

    let mediaUrls = [];
    let mediaTypes = [];
    let quoteBgUrl = null;

    // 🖼️ Quote background upload
    if (req.files?.quote_bg_url?.length > 0) {
      const bgFile = req.files.quote_bg_url[0];
      quoteBgUrl = await uploadToS3(bgFile, "community/");
    }

    // 📷 Media uploads
    if (req.files?.media?.length > 0) {
      for (const file of req.files.media) {
        let type = null;
        if (file.mimetype.startsWith("image/")) type = "image";
        else if (file.mimetype.startsWith("video/")) type = "video";

        const url = await uploadToS3(file, "community/");
        mediaUrls.push(url);
        mediaTypes.push(type);
      }
    }

    // ❌ Validation
    if (!message && mediaUrls.length === 0 && !feeling && !repost_id) {
      return res.status(400).json({
        error: "Message, media, repost, or feeling required"
      });
    }

    const cleanRepostId =
      repost_id && repost_id !== "null" && repost_id !== ""
        ? repost_id
        : null;

    // 🧾 Insert message
    const [insertResult] = await db.query(
      `INSERT INTO community (
        memberQid,
        message_text,
        feeling,
        repost_id,
        media_type,
        media_url,
        repost_bookQid,
        quote_text,
        quote_by,
        quote_font_family,
        quote_font_color,
        quote_bg_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberQid,
        message || null,
        feeling || null,
        cleanRepostId,
        JSON.stringify(mediaTypes),
        JSON.stringify(mediaUrls),
        bookQid || null,
        quote_text || null,
        quote_by || null,
        quote_font_family || null,
        quote_font_color || null,
        quoteBgUrl || null
      ]
    );

    // 📚 Resolve main post book
    let book = null;
    if (bookQid) {
      const bookResult = await fetchBookByQid(bookQid);
      book = bookResult.length ? bookResult[0] : null;
    }

    // 🔁 Resolve repost data
    let repostData = null;

    if (cleanRepostId) {
      const [rows] = await db.query(
        `SELECT 
          c.message_id,
          c.message_text AS message,
          c.feeling,
          c.repost_bookQid,
          c.quote_text,
          c.quote_by,
          c.quote_font_color,
          c.quote_font_family,
          c.quote_bg_url,
          c.media_type,
          c.media_url,
          c.memberQid,
          c.created_at,
          u.username
        FROM community c
        JOIN users u ON c.memberQid = u.memberQid
        WHERE c.message_id = ?`,
        [cleanRepostId]
      );

      if (rows.length > 0) {
        const repostRow = rows[0];

        // 📚 Resolve repost book
        let repostBook = null;
        if (repostRow.repost_bookQid) {
          const repostBookResult = await fetchBookByQid(
            repostRow.repost_bookQid
          );
          repostBook = repostBookResult.length
            ? repostBookResult[0]
            : null;
        }

        repostData = {
          message_id: repostRow.message_id,
          message: repostRow.message,
          feeling: repostRow.feeling,
          results: repostBook? [repostBook] : [],
          quote_text: repostRow.quote_text,
          quote_by: repostRow.quote_by,
          quote_font_family: repostRow.quote_font_family,
          quote_font_color: repostRow.quote_font_color,
          quote_bg_url: repostRow.quote_bg_url,
          media_type: repostRow.media_type
            ? JSON.parse(repostRow.media_type)
            : [],
          media_url: repostRow.media_url
            ? JSON.parse(repostRow.media_url)
            : [],
          memberQid: repostRow.memberQid,
          username: repostRow.username,
          createFormNow: dayjs(repostRow.created_at).fromNow()
        };
      }
    }

    // 📦 Final payload (Socket.IO + REST)
    const msgObj = {
      message_id: insertResult.insertId,
      memberQid,
      username,
      feeling,
      message: message || "",
      results: book ? [book] : [],
      media_type: mediaTypes,
      media_url: mediaUrls,
      like_count: 0,
      comment_count: 0,
      repost_count: 0,
      repost_id: cleanRepostId,
      repostData,
      quote_text,
      quote_by,
      quote_font_family,
      quote_font_color,
      quote_bg_url: quoteBgUrl,
      createFormNow: "just now"
    };

    res.json(msgObj);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
};

// const sendMessage = async (req, res) => {
//   try {
//     const memberQid = req.user.memberQid;
//     const username = req.user.username;
//     const { message, feeling, repost_id, bookQid, quote_text, quote_by, quote_font_family, quote_font_color } = req.body;

//     let mediaUrls = [];
//     let mediaTypes = [];
//     let quoteBgUrl = null;

// if (req.files?.quote_bg_url?.length > 0) {
//   const bgFile = req.files.quote_bg_url[0];
//   quoteBgUrl = await uploadToS3(bgFile, "community/");
// }



//     // Support multiple file uploads (req.files instead of req.file)
//     if (req.files?.media && req.files?.media.length > 0) {
//       for (const file of req.files.media) {
//         let type = null;
//         if (file.mimetype.startsWith("image/")) type = "image";
//         else if (file.mimetype.startsWith("video/")) type = "video";

//         const url = await uploadToS3(file, "community/");
//         mediaUrls.push(url);
//         mediaTypes.push(type);
//       }
//     }

//     if (!message && mediaUrls.length === 0 && !feeling && !repost_id) {
//       return res.status(400).json({ error: "Message, media, repost content,or feeling required" });
//     }

    
//     const cleanRepostId =
//   repost_id && repost_id !== "null" && repost_id !== "" ? repost_id : null;

//   const [result] = await db.query(
//   `INSERT INTO community (
//     memberQid,
//     message_text,
//     feeling,
//     repost_id,
//     media_type,
//     media_url,
//     repost_bookQid,
//     quote_text,
//     quote_by,
//     quote_font_family,
//     quote_font_color,
//     quote_bg_url
//   )
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//   [
//     memberQid,
//     message || null,
//     feeling || null,
//     cleanRepostId,
//     JSON.stringify(mediaTypes),
//     JSON.stringify(mediaUrls),
//     bookQid || null,
//     quote_text || null,
//     quote_by || null,
//     quote_font_family || null,
//     quote_font_color || null,
//     quoteBgUrl || null
//   ]
// );
  
//     // Fetch repost info if repost_id exists
//     let repostData = null;
//     if (repost_id) {
//       const [rows] = await db.query(
//         `SELECT 
//             c.message_id,
//             c.message_text AS message,  
//             c.feeling,
//             c.repost_bookQid,
//             c.quote_text,
//             c.quote_by,
//             c.quote_font_color,
//             c.quote_font_family,
//             c.quote_bg_url,
//             c.memberQid, 
//             c.media_type,
//             c.media_url,
//             c.created_at,
//             u.username
//          FROM community c
//          JOIN users u ON c.memberQid = u.memberQid
//          WHERE c.message_id = ?`,
//         [repost_id]
//       );

//       if (rows.length > 0) {
//         repostData = rows[0];
//         // ✅ Parse JSON fields
//         repostData.media_url = repostData.media_url
//           ? JSON.parse(repostData.media_url)
//           : [];
//         repostData.media_type = repostData.media_type
//           ? JSON.parse(repostData.media_type)
//           : [];
//       }
//     }

//     const msgObj = {
//       message_id: result.insertId,
//       memberQid,
//       username,
//       feeling,
//       message: message || "",
//       media_type: mediaTypes,
//       media_url: mediaUrls,
//       createFormNow: "just now",
//       like_count: 0,
//       repostData,
//       quote_text,
//       quote_by,
//       quote_font_family,
//       quote_font_color,
//       quoteBgUrl
     
//     };

//     res.json(msgObj);
//   } catch (err) {
//     console.error("sendMessage error:", err);
//     res.status(500).json({ error: "Internal Server Error", details: err.message });
//   }
// };




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
  getAllMessagesByMemberQid,
  sendMessage,
  editMessage,
  deleteMessage,
  shareBook
};
