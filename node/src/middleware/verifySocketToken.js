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

const jwt = require("jsonwebtoken");

function verifySocketToken(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Token required"));
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    socket.user = decoded; // attach decoded user to socket
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
}

module.exports =  verifySocketToken ;
