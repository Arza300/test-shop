import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = "auto";
const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET_NAME;
const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;

function r2Client() {
  if (!accountId || !accessKey || !secretKey) {
    throw new Error("R2 env vars are not set (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)");
  }
  return new S3Client({
    region,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

export function isR2Configured(): boolean {
  return Boolean(accountId && bucket && accessKey && secretKey);
}

export async function uploadObjectFromBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  const client = r2Client();
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  );
  if (!publicBase) {
    return `r2:///${bucket}/${key}`;
  }
  return `${publicBase}/${key}`;
}

export async function deleteObject(key: string) {
  if (!bucket) return;
  const client = r2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getObjectBytes(key: string) {
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  const client = r2Client();
  const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!out.Body) throw new Error("R2 object body is empty");
  const bytes = await out.Body.transformToByteArray();
  return {
    bytes,
    contentType: out.ContentType ?? "application/octet-stream",
    cacheControl: out.CacheControl ?? "public, max-age=3600",
    etag: out.ETag,
  };
}

/**
 * Presigned PUT for direct browser uploads (admin UI).
 */
export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 300) {
  if (!bucket) throw new Error("R2_BUCKET_NAME is not set");
  const client = r2Client();
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn });
}
