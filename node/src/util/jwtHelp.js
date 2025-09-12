const jwt = require('jsonwebtoken');
require('dotenv').config();

const createToken = (payload) => {
  return jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '3d' });
};

module.exports = {createToken};
