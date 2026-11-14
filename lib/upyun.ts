import { createHash, createHmac, randomUUID } from "node:crypto";
import { extensionFor, isUpyunImageUrl, type ImageFormat } from "./image-utils";
export { isUpyunImageUrl } from "./image-utils";

const UPYUN_API_ORIGIN = "https://v0.api.upyun.com";

function getConfig() {
  const bucket = process.env.UPYUN_BUCKET;
  const operator = process.env.UPYUN_OPERATOR;
  const password = process.env.UPYUN_PASSWORD;
  const publicBaseUrl = process.env.UPYUN_PUBLIC_BASE_URL;
  if (!bucket || !operator || !password || !publicBaseUrl) {
    throw new Error("又拍云配置不完整");
  }

  return { bucket, operator, password, publicBaseUrl: getUpyunPublicBaseUrl()! };
}

export function getUpyunPublicBaseUrl(): string | null {
  const value = process.env.UPYUN_PUBLIC_BASE_URL;
  if (!value) return null;
  const base = new URL(value);
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) {
    throw new Error("UPYUN_PUBLIC_BASE_URL 必须是不含凭据或参数的 HTTPS URL");
  }
  return base.href.replace(/\/$/, "");
}

function authorization(method: "PUT" | "DELETE", uri: string, date: string) {
  const { operator, password } = getConfig();
  // UPYUN_PASSWORD may be supplied as the MD5 digest shown in the console.
  const passwordKey = /^[a-f\d]{32}$/i.test(password)
    ? password.toLowerCase()
    : createHash("md5").update(password).digest("hex");
  const signature = createHmac("sha1", passwordKey)
    .update([method, uri, date].join("&"))
    .digest("base64");
  return `UPYUN ${operator}:${signature}`;
}

function remoteUri(key: string) {
  const { bucket } = getConfig();
  if (!/^\/diary\/[a-zA-Z0-9_/-]+\.(?:jpg|png|webp|avif)$/.test(key) || key.includes("..")) {
    throw new Error("又拍云文件路径无效");
  }
  return `/${bucket}${key}`;
}

async function request(method: "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string) {
  const uri = remoteUri(key);
  const date = new Date().toUTCString();
  const response = await fetch(`${UPYUN_API_ORIGIN}${uri}`, {
    method,
    headers: {
      Date: date,
      Authorization: authorization(method, uri, date),
      ...(body ? { "Content-Type": contentType ?? "application/octet-stream" } : {}),
    },
    ...(body ? { body: new Uint8Array(body) } : {}),
    signal: AbortSignal.timeout(30_000),
    redirect: "error",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`又拍云 ${method} 请求失败（HTTP ${response.status}）：${detail}`);
  }
}

export async function uploadToUpyun(buffer: Buffer, format: ImageFormat): Promise<string> {
  const { publicBaseUrl } = getConfig();
  const date = new Date();
  const key = `/diary/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${extensionFor(format)}`;
  const contentType = `image/${format === "jpeg" ? "jpeg" : format}`;
  await request("PUT", key, buffer, contentType);
  return `${publicBaseUrl}${key}`;
}

export async function deleteFromUpyun(url: string): Promise<void> {
  if (!isUpyunImageUrl(url)) throw new Error("又拍云文件地址无效");
  const image = new URL(url);
  const publicPath = new URL(getUpyunPublicBaseUrl()!).pathname.replace(/\/$/, "");
  await request("DELETE", image.pathname.slice(publicPath.length));
}
