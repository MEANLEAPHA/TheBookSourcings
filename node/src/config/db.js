// Import mysql
const e = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const dbconfig = mysql.createPool(
    {
        host: "srv1777.hstgr.io", //localhost
        user:"u523916255_TBSTEAM", //root
        password: 'TbS$$333&&2025', //password
        database:"u523916255_TBS", //database
        waitForConnections: true, //wait for connections
        connectionLimit: 10, //max connections
        port: 3306, //port
        queueLimit: 0,//max waiting connections
    }
)

// Export the database
module.exports = dbconfig; 
