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
const trendingRoutes = require('./routes/book/trending/trendingRoutes'); // ✅ trending route

// Initialize Routes
TheBookSourcingUser(app);
app.use('/api/trending', trendingRoutes); // ✅ mount trending API

// Start Server
const port = 3000;
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
