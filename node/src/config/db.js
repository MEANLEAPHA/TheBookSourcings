// Import mysql
const e = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const dbconfig = mysql.createPool({
  host: "srv1656.hstgr.io",
  user: "u859618886_otthorAdmin",
  password: "OtthorAnd2005",
  database: "u859618886_otthorDB",
  port: 3306,

  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,

  connectTimeout: 30000,      // ⭐ IMPORTANT (30s)
  enableKeepAlive: true,      // ⭐ prevents idle drop
  keepAliveInitialDelay: 0    // ⭐ immediate keepalive
});

// Export the database
module.exports = dbconfig; 
