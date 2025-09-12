const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,       // from IAM user
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // from IAM user
  region: process.env.AWS_REGION                   // bucket region
});

// Multer S3 storage
const uploadAWS = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,          // your bucket
    acl: 'public-read',                           // file public
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = Date.now() + '-' + file.originalname;
      cb(null, fileName);
    }
  })
});

module.exports = uploadAWS;
