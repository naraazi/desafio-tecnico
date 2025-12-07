import { S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config();

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  console.warn("S3 credentials/region not fully set in environment variables.");
}

export const s3Client = new S3Client({
  region,
  credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

export const s3Bucket = process.env.S3_BUCKET || "";
export const isBucketPrivate = (process.env.BUCKET_PRIVADO || "true").toLowerCase() === "true";
