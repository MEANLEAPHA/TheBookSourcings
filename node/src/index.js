// Import Express & Middleware
const { instrument } = require("@socket.io/admin-ui")
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); 
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
const trendingRoutes = require('./routes/book/trending/trendingRoutes'); //  trending route
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

io.on('connection', socket => {
    console.log('Socket connected:', socket.id);
    socket.on('send-message', (message, room)=>{
        if(room === ''){
            socket.broadcast.emit('receive-message', message)
        }
        else{
            socket.to(room).emit('receive-message', message)
        }
        
    })
    socket.on('join-room', (room, cb) =>{
        socket.join(room);
        cb(`Joined ${room}`)
    })
});

instrument(io, {auth: false})

// Start Server
const port = 3000;
server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});


