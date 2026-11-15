import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { extensionFor, type ImageFormat } from "./image-utils";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

type B2Config = {
  bucket: string;
  region: string;
  endpoint: string;
  keyId: string;
  applicationKey: string;
  keyPrefix: string;
};

let cachedClient: { config: B2Config; client: S3Client } | null = null;

function getConfig(): B2Config {
  const bucket = process.env.B2_BUCKET?.trim();
  const region = process.env.B2_REGION?.trim();
  const endpoint = process.env.B2_ENDPOINT?.trim();
  const keyId = process.env.B2_KEY_ID?.trim();
  const applicationKey = process.env.B2_APPLICATION_KEY?.trim();
  const keyPrefix = (process.env.B2_KEY_PREFIX?.trim() || "diary").replace(/^\/+|\/+$/g, "");

  if (!bucket || !region || !endpoint || !keyId || !applicationKey) {
    throw new Error("Backblaze B2 配置不完整，请填写 B2_BUCKET、B2_REGION、B2_ENDPOINT、B2_KEY_ID 和 B2_APPLICATION_KEY");
  }

  const parsedEndpoint = new URL(endpoint);
  if (parsedEndpoint.protocol !== "https:" || parsedEndpoint.username || parsedEndpoint.password || parsedEndpoint.search || parsedEndpoint.hash) {
    throw new Error("B2_ENDPOINT 必须是不含凭据或参数的 HTTPS URL");
  }

  return { bucket, region, endpoint: parsedEndpoint.origin, keyId, applicationKey, keyPrefix };
}

function getClient() {
  const config = getConfig();
  if (cachedClient?.config.bucket === config.bucket && cachedClient.config.endpoint === config.endpoint && cachedClient.config.keyId === config.keyId) {
    return cachedClient;
  }

  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.keyId,
      secretAccessKey: config.applicationKey,
    },
  });
  cachedClient = { config, client };
  return cachedClient;
}

export function isB2ObjectKey(value: string): boolean {
  return /^(?:diary|album)\/\d{4}\/\d{2}\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|avif)$/.test(value) && !value.includes("..");
}

export function isB2ProxyImageUrl(value: string): boolean {
  try {
    const url = new URL(value, "https://local.invalid");
    if (url.pathname !== "/api/media" || url.searchParams.has("id")) return false;
    const key = url.searchParams.get("key");
    return Boolean(key && key.startsWith("diary/") && isB2ObjectKey(key) && url.searchParams.toString() === `key=${encodeURIComponent(key)}`);
  } catch {
    return false;
  }
}

export function b2KeyFromProxyUrl(value: string): string | null {
  if (!isB2ProxyImageUrl(value)) return null;
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

export async function uploadToB2(buffer: Buffer, format: ImageFormat, key = diaryKeyForUpload(format)) {
  const { config: bucket, client } = getClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket.bucket,
    Key: key,
    Body: buffer,
    ContentType: `image/${format === "jpeg" ? "jpeg" : format}`,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { key, url: `/api/media?key=${encodeURIComponent(key)}` };
}

export async function createB2UploadUrl(key: string, contentType: string, expiresIn = 900) {
  if (!isB2ObjectKey(key)) throw new Error("B2 文件路径无效");
  const { config: bucket, client } = getClient();
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket.bucket, Key: key, ContentType: contentType }), { expiresIn });
}

export async function createB2DownloadUrl(key: string, expiresIn = SIGNED_URL_TTL_SECONDS) {
  if (!isB2ObjectKey(key)) throw new Error("B2 文件路径无效");
  const { config: bucket, client } = getClient();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket.bucket, Key: key }), { expiresIn });
}

export async function deleteFromB2(key: string): Promise<void> {
  if (!isB2ObjectKey(key)) throw new Error("B2 文件路径无效");
  const { config: bucket, client } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket.bucket, Key: key }));
}

export function b2BucketName(): string {
  return getConfig().bucket;
}
