/** @format */

export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/frilo",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "super-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_BUCKET_NAME,
  },
});
