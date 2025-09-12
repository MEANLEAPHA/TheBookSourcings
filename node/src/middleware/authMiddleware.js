const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = decoded; // userId and email
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = { authMiddleware };
