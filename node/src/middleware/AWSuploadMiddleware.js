



const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
require('dotenv').config();
// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Multer storage function using v3
const storage = multer.memoryStorage(); // keep files in memory for lib-storage

const upload = multer({ storage });

const uploadToS3 = async (file, folder = "") => {
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ACL: "public-read"
  };

  const parallelUpload = new Upload({
    client: s3Client, // must be v3 S3Client
    params: uploadParams
  });

  const result = await parallelUpload.done();
  return result.Location; // the file URL
};

module.exports = { upload, uploadToS3 };

