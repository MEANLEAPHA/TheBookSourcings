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
const communityLikeRoute =  require('./routes/chat/community/communityLike/communityPostLikeRoutes');

const communityCommentLikeRoutes = require('./routes/chat/community/communityLike/communityCommentLikeRoutes');
const verifySocketToken  = require('./middleware/verifySocketToken');


// report post and comment
const reportCommunityRoute = require('./routes/chat/community/reportPAC/reportRoutes')

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

app.use('/api/communityPostLike', communityLikeRoute);

//community comment like 
app.use('/api/communityCommentLike', communityCommentLikeRoutes);



// report 
app.use("/api/community", reportCommunityRoute)



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
    createFormNow: data.createFormNow || "just now"
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




