import "dotenv/config";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db, pool } from "../lib/db";
import { albumImages, postImages } from "../lib/schema";
import { storageKeyFromProxyUrl } from "../lib/object-storage";

type StorageConfig = {
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`缺少环境变量 ${name}`);
  return value;
}

function config(prefix: "SOURCE_OBJECT_STORAGE" | "OBJECT_STORAGE"): StorageConfig {
  const endpoint = new URL(required(`${prefix}_ENDPOINT`));
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error(`${prefix}_ENDPOINT 必须是不含凭据或参数的 HTTPS URL`);
  }
  return {
    bucket: required(`${prefix}_BUCKET`),
    region: required(`${prefix}_REGION`),
    endpoint: endpoint.origin,
    accessKeyId: required(`${prefix}_ACCESS_KEY_ID`),
    secretAccessKey: required(`${prefix}_SECRET_ACCESS_KEY`),
  };
}

function client(value: StorageConfig): S3Client {
  return new S3Client({
    endpoint: value.endpoint,
    region: value.region,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey },
  });
}

async function databaseObjectKeys(): Promise<string[]> {
  const [diaryRows, albumRows] = await Promise.all([
    db.select({ url: postImages.url }).from(postImages),
    db.select({ objectKey: albumImages.objectKey }).from(albumImages),
  ]);
  const keys = new Set<string>();
  for (const row of diaryRows) {
    const key = storageKeyFromProxyUrl(row.url);
    if (key) keys.add(key);
  }
  for (const row of albumRows) {
    if (/^album\/\d{4}\/\d{2}\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|avif)$/.test(row.objectKey)) keys.add(row.objectKey);
  }
  return [...keys];
}

const source = config("SOURCE_OBJECT_STORAGE");
const target = config("OBJECT_STORAGE");
if (source.endpoint === target.endpoint && source.bucket === target.bucket) throw new Error("源和目标对象存储不能是同一个桶");

const sourceClient = client(source);
const targetClient = client(target);
const keys = await databaseObjectKeys();
console.log(`数据库登记了 ${keys.length} 个需要迁移的对象`);

let copied = 0;
for (const key of keys) {
  const result = await sourceClient.send(new GetObjectCommand({ Bucket: source.bucket, Key: key }));
  if (!result.Body) throw new Error(`源对象没有内容：${key}`);
  const body = Buffer.from(await result.Body.transformToByteArray());
  await targetClient.send(new PutObjectCommand({
    Bucket: target.bucket,
    Key: key,
    Body: body,
    ContentType: result.ContentType,
    CacheControl: result.CacheControl,
    ContentLanguage: result.ContentLanguage,
    ContentDisposition: result.ContentDisposition,
    Metadata: result.Metadata,
  }));
  copied += 1;
  console.log(`[${copied}/${keys.length}] 已复制 1 个对象 (${body.length} bytes)`);
}

console.log(`迁移完成：${copied} 个对象已复制到 ${target.bucket}。源桶未删除，可核对无误后再清理。`);
await pool.end();
