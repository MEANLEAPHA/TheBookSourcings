



const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
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
    ContentType: file.mimetype,
    ACL: "public-read" // used to clode for upload book but for testing community i have to open it back
  };

  const parallelUpload = new Upload({
    client: s3Client, // must be v3 S3Client
    params: uploadParams
  });

  const result = await parallelUpload.done();
  return result.Location; // the file URL
};


const deleteFromS3 = async (fileUrl) => {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    // Extract key from fileUrl (everything after bucket domain)
    const key = decodeURIComponent(fileUrl.split(".amazonaws.com/")[1]);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);
    console.log(`Deleted from S3: ${key}`);
  } catch (err) {
    console.error("deleteFromS3 Error:", err.message);
  }
};

module.exports = { upload, uploadToS3, deleteFromS3 };

