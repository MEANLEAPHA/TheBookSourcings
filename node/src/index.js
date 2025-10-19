// Import Express & Middleware
const { instrument } = require("@socket.io/admin-ui")
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
const db = require("./config/db"); // your MySQL pool/connection
const app = express();
app.use(cors(
    {
        origin: ["https://admin.socket.io", "https://thebooksourcings.onrender.com"],
        credentials: true
    }
));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from the src/public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Handle root path and send index.html from src/public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Import Routes
const { TheBookSourcingUser } = require('./routes/userRoute');
const trendingRoutes = require('./routes/book/trending/trendingRoutes'); 
const aboutBookInfoRoute = require('./routes/book/about/allAboutRoute');
const similarBookRoute = require('./routes/book/about/simiarBookRoute');
const bookByAuthorRoute = require('./routes/book/about/bookByAuthorsRoute');
const aboutAuthorInfo = require('./routes/book/about/allAboutAuthorInfoRoute');
const aboutAuthorDetails = require('./routes/book/about/aboutAuthorDetailsRoute');
const similarAuthorDetail = require('./routes/book/about/similarAuthorRoutes');
const notableWork = require('./routes/book/about/notableWorkRoutes');
const {bookRoutes} = require('./routes/book/uploadBookRoute/upload');
const getBookByQidRoute = require('./routes/book/uploadBookRoute/paramQueryRoute');
const getMyBooksRoutes = require('./routes/book/uploadBookRoute/queryRoutes');
const displayUserUploadBookRoute = require('./routes/book/displayUserBook/displayBookRoutes');
const viewRoute = require('./routes/book/bookActivity/viewRoute');
const RDSroute = require('./routes/book/bookActivity/RDSroute');
const LAF = require('./routes/book/userBookStatus/LAFroutes');
const followRoute = require('./routes/book/userFollowStatus/followRoute');
const communityRoutes = require('./routes/chat/community/communityRoutes');
// community comment post
const communityCommentRoute = require('./routes/chat/community/commentViewRoutes');
// community reply post 
const communityReplyRoutes = require('./routes/chat/community/replyRoutes');
const communityLikeRoute =  require('./routes/chat/community/communityLike/communityPostLikeRoutes');
const communityFavRoute = require('./routes/chat/community/communityLike/communityPostFavRoutes');
const communityCommentLikeRoutes = require('./routes/chat/community/communityLike/communityCommentLikeRoutes');
const communityReplyLikeRoutes = require('./routes/chat/community/communityLike/communityReplyLikeRoutes');
const verifySocketToken  = require('./middleware/verifySocketToken');
// report post and comment
const reportCommunityRoute = require('./routes/chat/community/reportPAC/reportRoutes');
const bookSellerRoutes = require("./routes/shop/saleRoute");

// order and chat 
const chatController = require("./controller/chat/room/chatController");

const roomChat = require("./routes/chat/room/chatRoutes");

// Initialize Routes
TheBookSourcingUser(app);
bookRoutes(app);
app.use('/api/trending', trendingRoutes); // ✅ mount trending API
app.use('/api/aboutBook', aboutBookInfoRoute);
app.use('/api/similar', similarBookRoute);
app.use('/api/bookByAuthor', bookByAuthorRoute);
app.use('/api/aboutAuthor', aboutAuthorInfo);
app.use('/api/author', aboutAuthorDetails);
app.use('/api/authors/similar', similarAuthorDetail);
app.use('/api/authors/notableWork', notableWork);
app.use('/api/getBookByQid', getBookByQidRoute);
app.use('/api/getMyBooks', getMyBooksRoutes);
app.use('/api/books', displayUserUploadBookRoute);
app.use('/api/books/view', viewRoute);
app.use('/api/books', RDSroute);
app.use('/api/LAFbook', LAF);
app.use('/api', followRoute);
app.use("/api/community", communityRoutes);
// community comment post 
app.use("/api/communityComment", communityCommentRoute);
// community reply post
app.use("/api/communityReply", communityReplyRoutes);
app.use('/api/communityPostLike', communityLikeRoute);
app.use('/api/communityPostFav', communityFavRoute)
//community comment like 
app.use('/api/communityCommentLike', communityCommentLikeRoutes);
// community reply like 
app.use('/api/communityReplyLike', communityReplyLikeRoutes);
// report 
app.use("/api/community", reportCommunityRoute);

app.use("/api/shop", bookSellerRoutes);

app.use("/api/chat", roomChat);

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO to the same server
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
    origin: ["https://admin.socket.io", "https://thebooksourcings.onrender.com"],
    credentials: true
    }
});

io.use(verifySocketToken); 
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.user?.memberQid || "Guest");

  // Community Post 

  socket.on("send-message", (data) => {
  if (!socket.user) return; // guest cannot send


  const broadcastData = {
    message_id: data.message_id,
    memberQid: socket.user.memberQid,
    username:data.username,
    feeling: data.feeling || null,
    message: data.message || null,
    media_url: data.media_url || [],
    media_type: data.media_type || [],
    createFormNow: data.createFormNow || "just now",
    repostData: data.repostData || null // ✅ include if repost
  };

  socket.broadcast.emit("receive-message", broadcastData);
  });

  socket.on("edit-message", (data) => {
    if (!socket.user) return;
    io.emit("message-updated", data);
  });

  socket.on("delete-message", (data) => {
    if (!socket.user) return;
    io.emit("message-deleted", data);
  });


  // COMMUNITY Comment post socket logical
  socket.on("send-comment", (data) => {
    if(!socket.user) return;
    const broadcastData = {
      comment_id : data.comment_id,
      memeberQid:socket.user.memberQid,
      username:data.username,
      comment: data.comment || null,
      media_url: data.media_url || null,
      media_type: data.media_type || null,
      createFormNow: data.createFormNow || "just now"
    };
    socket.broadcast.emit("receive-comment", broadcastData)
  })

  socket.on("edit-comment", (data) => {
    if(!socket.user) return;
    io.emit("comment-updated", data)
  });

  socket.on("delete-comment", (data) => {
    if(!socket.user) return;
    io.emit("comment-deleted", data)
  });


   // COMMUNITY reply to comment post socket logical
  socket.on("send-reply", (data) => {
    if(!socket.user) return;
    const broadcastData = {
      reply_id : data.reply_id,
      memeberQid:socket.user.memberQid,
      username:data.username,
      reply: data.reply || null,
      media_url: data.media_url || null,
      media_type: data.media_type || null,
      createFormNow: data.createFormNow || "just now",
      replyBackTo_id: data.replyBackTo_id 
    };
    socket.broadcast.emit("receive-reply", broadcastData)
  })

  socket.on("edit-reply", (data) => {
    if(!socket.user) return;
    io.emit("reply-updated", data)
  });

  socket.on("delete-reply", (data) => {
    if(!socket.user) return;
    io.emit("reply-deleted", data)
  });




 
//   socket.on("joinRoom", (roomId) => {
//     if (!socket.user) return;
//     socket.join(roomId);
//     console.log(`🟢 User ${socket.user.memberQid} joined room ${roomId}`);
//   });

  
//   socket.on("sendMessage", async ({ roomId, message }) => {
//     if (!socket.user) return;
//     const senderQid = socket.user.memberQid;

//     try {
   
//       await chatController.saveChatMessage(roomId, senderQid, message);

//       io.to(roomId).emit("receiveMessage", {
//         roomId,
//         senderQid,
//         message,
//         timestamp: new Date(),
//       });
//     } catch (err) {
//       console.error("Error saving chat message:", err);
//     }
//   });
  
//   socket.on("messageSeen", async ({ messageId, roomId }) => {
//     if (!socket.user) return;
//     const viewerQid = socket.user.memberQid;

//     try {
//       const updated = await chatController.markMessageSeen(messageId, viewerQid);
//       if (updated) {
//         io.to(roomId).emit("messageSeen", { messageId });
//       }
//     } catch (err) {
//       console.error("Error marking message seen:", err);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("🔴 User disconnected:", socket.user?.memberQid || socket.id);
//   });


// socket.on("editMessage", async (data) => {
//   const senderQid = socket.user.memberQid;
//   const { messageId, newMessage } = data;
//   const updated = await chatController.updateChatMessage(messageId, senderQid, newMessage);
//   if (updated) {
//     io.to(data.roomId).emit("messageEdited", { messageId, newMessage });
//   }
// });


// socket.on("deleteMessage", async (data) => {
//   const senderQid = socket.user.memberQid;
//   const { messageId } = data;
//   const deleted = await chatController.deleteChatMessage(messageId, senderQid);
//   if (deleted) {
//     io.to(data.roomId).emit("messageDeleted", { messageId });
//   }
// });
// 🧩 User connects
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.user?.memberQid);

  // ✅ Join specific chat room
  socket.on("joinRoom", (roomId) => {
    if (!socket.user) return;
    socket.join(roomId);
    console.log(`🟢 User ${socket.user.memberQid} joined room ${roomId}`);
  });

  // ✅ Send chat message
  socket.on("sendMessage", async ({ roomId, message }) => {
    if (!socket.user || !roomId || !message?.trim()) return;
    const senderQid = socket.user.memberQid;

    try {
      // Save message in DB (and return data)
      const savedMsg = await chatController.saveChatMessage(roomId, senderQid, message);

      // Emit message to all users in the room
      io.to(roomId).emit("receiveMessage", savedMsg);
    } catch (err) {
      console.error("❌ Error saving chat message:", err);
    }
  });

  // ✅ Seen message logic
  socket.on("messageSeen", async ({ messageId, roomId }) => {
    if (!socket.user || !messageId || !roomId) return;
    const viewerQid = socket.user.memberQid;

    try {
      const updated = await chatController.markMessageSeen(messageId, viewerQid);
      if (updated) {
        io.to(roomId).emit("messageSeen", { messageId });
      }
    } catch (err) {
      console.error("❌ Error marking message seen:", err);
    }
  });

  // ✅ Edit message logic
  socket.on("editMessage", async ({ messageId, newMessage, roomId }) => {
    if (!socket.user || !messageId || !roomId) return;
    const senderQid = socket.user.memberQid;

    try {
      const updated = await chatController.updateChatMessage(messageId, senderQid, newMessage);
      if (updated) {
        io.to(roomId).emit("messageEdited", { messageId, newMessage });
      }
    } catch (err) {
      console.error("❌ Error editing message:", err);
    }
  });

  // ✅ Delete message logic
  socket.on("deleteMessage", async ({ messageId, roomId }) => {
    if (!socket.user || !messageId || !roomId) return;
    const senderQid = socket.user.memberQid;

    try {
      const deleted = await chatController.deleteChatMessage(messageId, senderQid);
      if (deleted) {
        io.to(roomId).emit("messageDeleted", { messageId });
      }
    } catch (err) {
      console.error("❌ Error deleting message:", err);
    }
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.user?.memberQid || socket.id);
  });
});


});


instrument(io, {
  namespaceName: "/admin",
  auth: false
});


// Start Server
const port = 3000;
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});




