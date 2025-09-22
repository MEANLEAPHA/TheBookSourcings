// const jwt = require("jsonwebtoken");

// const verifySocketToken = (socket, next) => {
//   const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

//   if (!token) {
//     return next(new Error("Authentication error: Token required"));
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     next(new Error("Authentication error: Invalid or expired token"));
//   }
// };

// module.exports = verifySocketToken;



// socket middleware
const jwt = require("jsonwebtoken");

const verifySocketToken = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    // Guest user → allow connection but no user info
    socket.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    socket.user = decoded; // attach user info for insiders
    next();
  } catch (err) {
    // Invalid token → treat as guest
    socket.user = null;
    next();
  }
};

module.exports = verifySocketToken;

