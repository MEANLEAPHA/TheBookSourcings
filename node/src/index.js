// Import Express & Middleware
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
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
const displayUserUploadBookRoute = require('./routes/book/displayUserBook/displayBookRoutes')

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





// Start Server
const port = 3000;
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
