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

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null; // guest
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = decoded; // { userId, email, ... }
  } catch (err) {
    req.user = null; // invalid or expired token → treat as guest
  }

  next();
};

module.exports = { authMiddleware, optionalAuth };

// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//     const token = req.headers.authorization?.split(" ")[1];

//     if (!token) {
//         // For optional routes, set user to null and continue
//         if (req.optionalAuth === true) {
//             req.user = null;
//             return next();
//         }
//         // For required routes, return error
//         return res.status(401).json({ message: "Token required" });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         // For optional routes, set user to null and continue
//         if (req.optionalAuth === true) {
//             req.user = null;
//             return next();
//         }
//         // For required routes, return error
//         res.status(403).json({ message: "Invalid or expired token" });
//     }
// };

// // Helper middleware to mark route as optional
// const optionalAuth = (req, res, next) => {
//     req.optionalAuth = true;
//     next();
// };

// module.exports = { authMiddleware, optionalAuth };