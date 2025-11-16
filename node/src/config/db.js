// Import mysql
const e = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const dbconfig = mysql.createPool(
    {
        host: "srv1777.hstgr.io", //localhost
        user:"u859618886_otthorAdmin", //root
        password:'Otthor1133$$2005', //password
        database:"u859618886_otthorDB", //database
        waitForConnections: true, //wait for connections
        connectionLimit: 10, //max connections
        port: 3306, //port
        queueLimit: 0,//max waiting connections
    }
)

// Export the database
module.exports = dbconfig; 
