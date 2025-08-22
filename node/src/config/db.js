// Import mysql
const e = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const dbconfig = mysql.createPool(
    {
        host: "srv1777.hstgr.io", //localhost
        user:"u523916255_Meanleap_Ha", //root
        password: 'Leap2005333', //password
        database:"u523916255_remindme", //database
        waitForConnections: true, //wait for connections
        connectionLimit: 10, //max connections
        port: 3306, //port
        queueLimit: 0,//max waiting connections
    }
)

// Export the database
module.exports = dbconfig; 
