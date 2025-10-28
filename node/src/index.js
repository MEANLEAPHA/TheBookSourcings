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
// const followRoute = require('./routes/book/userFollowStatus/followRoute'); old

const followLogicRoute = require('./routes/book/userFollowStatus/followLogicRoute');
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



// push nootification
// const pushNotification = require('./routes/service/pushRoute');


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
// app.use('/api', followRoute); old follow route
app.use('/api', followLogicRoute);
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


// push nootification
const pushNotification = require('./routes/service/pushRoute');
const pushController = require("./controller/service/pushController")
app.use("/api/notification", pushNotification);

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

// gobal check whether user is online or not
global.io = io;

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



  console.log("🟢 User connected:", socket.user?.memberQid);


// ✅ User joins a chat room
socket.on("joinRoom", async (roomId) => {
  if (!socket.user) return;
  socket.join(roomId);

  const receiverQid = socket.user.memberQid;

  try {
    // Mark all pending messages in this room as delivered
    const deliveredIds = await chatController.markMessageDelivered(roomId, receiverQid);

    if (deliveredIds.length) {
      // Notify everyone in the room about delivered messages
      io.to(roomId).emit("messageDelivered", { messageIds: deliveredIds, roomId });
    }
  } catch (err) {
    console.error("❌ Error marking messages delivered on joinRoom:", err);
  }
});

// ✅ Single message delivery (real-time online scenario)
socket.on("messageDelivered", async ({ messageId, roomId }) => {
  if (!socket.user || !messageId || !roomId) return;
  const receiverQid = socket.user.memberQid;

  try {
    // Only update if message still 'sent'
    const [rows] = await db.query(
      "SELECT status FROM messages WHERE messageId=? AND receiverQid=?",
      [messageId, receiverQid]
    );
    if (!rows.length || rows[0].status !== 'sent') return;

    await db.query(
      "UPDATE messages SET status='delivered', receiverSeen=0 WHERE messageId=? AND receiverQid=?",
      [messageId, receiverQid]
    );

    // Notify the room about the delivered message
    io.to(roomId).emit("messageDelivered", { messageIds: [messageId], roomId });
  } catch (err) {
    console.error("❌ Error marking single message delivered:", err);
  }
});

// socket.on("sendMessage", async ({ roomId, message, tempId }) => {
//     if (!socket.user) return;
//     const senderQid = socket.user.memberQid;

//     try {
//       const saved = await chatController.saveChatMessage(roomId, senderQid, message);
//       if (!saved) return;

//       // 1) Confirm to sender including tempId so client replaces exact element
//       socket.emit("messageSent", { ...saved, tempId });

//       // 2) Broadcast to other participants in room
//       socket.to(roomId).emit("receiveMessage", saved);

//     } catch (err) {
//       console.error("❌ Error saving chat message:", err);
//     }
//   });
socket.on("sendMessage", async ({ roomId, message, tempId }) => {
  if (!socket.user) return;
  const senderQid = socket.user.memberQid;

  try {
    console.log(`🔹 Sending message in room: ${roomId}`, { senderQid, message });

    // 1️⃣ Save the chat message
    const saved = await chatController.saveChatMessage(roomId, senderQid, message);
    if (!saved) return console.error("❌ Message not saved.");

    console.log("✅ Message saved:", saved);

    // 2️⃣ Emit to sender
    socket.emit("messageSent", { ...saved, tempId });

    // 3️⃣ Broadcast to others in room
    socket.to(roomId).emit("receiveMessage", saved);

    // 4️⃣ Determine receiver
    const [roomRows] = await db.query(
      "SELECT buyerQid, sellerQid FROM chatRooms WHERE roomId = ?",
      [roomId]
    );
    if (!roomRows.length) return console.error("❌ Room not found for push notification");

    const room = roomRows[0];
    const receiverQid = senderQid === room.buyerQid ? room.sellerQid : room.buyerQid;

    // 5️⃣ Send push only if offline
    if (!isUserOnline(receiverQid)) {
      const payload = {
        title: `New message from ${socket.user.username || "Someone"}`,
        body: message,
        url: `/chat/${roomId}` // frontend route when user clicks notification
      };
      const results = await pushController.sendPushToMember(receiverQid, payload);
      console.log("🔔 Push notification results:", results);
    }

  } catch (err) {
    console.error("❌ Error in sendMessage listener:", err);
  }
});

 

  // ✅ Seen message logic
socket.on("markRoomSeen", async ({ roomId }) => {
    if (!socket.user) return;
    const viewerQid = socket.user.memberQid;
    try {
      const updatedIds = await chatController.markAllMessagesSeen(roomId, viewerQid); // returns array of ids
      if (Array.isArray(updatedIds) && updatedIds.length) {
        io.to(roomId).emit("roomMessagesSeen", { messageIds: updatedIds, roomId });
      }
    } catch (err) {
      console.error("❌ Error marking room messages seen:", err);
    }
  });


  // Mark all messages in a room as seen
  socket.on("markRoomSeen", async ({ roomId }) => {
    if (!socket.user) return;
    try {
      const seenIds = await chatController.markAllMessagesSeen(roomId, socket.user.memberQid);
      if (seenIds.length) io.to(roomId).emit("roomMessagesSeen", { messageIds: seenIds, roomId });
    } catch (err) {
      console.error("❌ Error marking room messages seen:", err);
    }
  });

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

  // disconnect for status in future online || offine
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.user?.memberQid || socket.id);
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




