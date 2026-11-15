import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { extensionFor, type ImageFormat } from "./image-utils";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

type ObjectStorageConfig = {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

let cachedClient: { configKey: string; config: ObjectStorageConfig; client: S3Client } | null = null;

function getConfig(): ObjectStorageConfig {
  const bucket = process.env.OBJECT_STORAGE_BUCKET?.trim();
  const region = process.env.OBJECT_STORAGE_REGION?.trim();
  const endpoint = process.env.OBJECT_STORAGE_ENDPOINT?.trim();
  const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !region || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("对象存储配置不完整，请填写 OBJECT_STORAGE_BUCKET、OBJECT_STORAGE_REGION、OBJECT_STORAGE_ENDPOINT、OBJECT_STORAGE_ACCESS_KEY_ID 和 OBJECT_STORAGE_SECRET_ACCESS_KEY");
  }

  const parsedEndpoint = new URL(endpoint);
  if (parsedEndpoint.protocol !== "https:" || parsedEndpoint.username || parsedEndpoint.password || parsedEndpoint.search || parsedEndpoint.hash) {
    throw new Error("OBJECT_STORAGE_ENDPOINT 必须是不含凭据或参数的 HTTPS URL");
  }

  return { bucket, region, endpoint: parsedEndpoint.origin, accessKeyId, secretAccessKey };
}

function getClient() {
  const config = getConfig();
  const configKey = JSON.stringify(config);
  if (cachedClient?.configKey === configKey) return cachedClient;

  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedClient = { configKey, config, client };
  return cachedClient;
}

export function isStorageObjectKey(value: string): boolean {
  return /^(?:diary|album)\/\d{4}\/\d{2}\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|avif)$/.test(value) && !value.includes("..");
}

export function isStorageProxyImageUrl(value: string): boolean {
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.pathname !== "/api/media" || url.searchParams.has("id")) return false;
    const key = url.searchParams.get("key");
    return Boolean(key && key.startsWith("diary/") && isStorageObjectKey(key) && url.searchParams.toString() === `key=${encodeURIComponent(key)}`);
  } catch {
    return false;
  }
}

export function storageKeyFromProxyUrl(value: string): string | null {
  if (!isStorageProxyImageUrl(value)) return null;
  return new URL(value, "https://local.invalid").searchParams.get("key");
}

export function albumKeyForUpload(format: ImageFormat = "webp"): string {
  getConfig();
  const date = new Date();
  return `album/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extensionFor(format)}`;
}

export function diaryKeyForUpload(format: ImageFormat): string {
  getConfig();
  const date = new Date();
  return `diary/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extensionFor(format)}`;
}

export async function uploadToStorage(buffer: Buffer, format: ImageFormat, key = diaryKeyForUpload(format)) {
  const { config, client } = getClient();
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: `image/${format === "jpeg" ? "jpeg" : format}`,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { key, url: `/api/media?key=${encodeURIComponent(key)}` };
}

export async function createStorageUploadUrl(key: string, contentType: string, expiresIn = 900) {
  if (!isStorageObjectKey(key)) throw new Error("对象存储文件路径无效");
  const { config, client } = getClient();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: contentType }), { expiresIn });
}

export async function createStorageDownloadUrl(key: string, expiresIn = SIGNED_URL_TTL_SECONDS) {
  if (!isStorageObjectKey(key)) throw new Error("对象存储文件路径无效");
  const { config, client } = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn });
}

export async function deleteFromStorage(key: string): Promise<void> {
  if (!isStorageObjectKey(key)) throw new Error("对象存储文件路径无效");
  const { config, client } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

export function objectStorageBucketName(): string {
  return getConfig().bucket;
}
