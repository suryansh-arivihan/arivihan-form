import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "mldatabase";
const S3_FOLDER_PREFIX = process.env.S3_FOLDER_PREFIX || "arivihan-form-submissions";

function getFullKey(key: string): string {
  return `${S3_FOLDER_PREFIX}/${key}`;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 900
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const fullKey = getFullKey(key);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fullKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.APP_AWS_REGION || "ap-south-1"}.amazonaws.com/${fullKey}`;

  return { uploadUrl, fileUrl };
}

export function getFileUrl(key: string): string {
  const fullKey = getFullKey(key);
  return `https://${BUCKET_NAME}.s3.${process.env.APP_AWS_REGION || "ap-south-1"}.amazonaws.com/${fullKey}`;
}

export async function generatePresignedDownloadUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  // Extract the key from the full S3 URL
  const url = new URL(fileUrl);
  const key = decodeURIComponent(url.pathname.slice(1)); // Remove leading '/'

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
