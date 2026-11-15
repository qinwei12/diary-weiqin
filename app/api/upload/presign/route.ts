import { getSession } from "@/lib/auth";
import { createStorageUploadUrl, diaryKeyForUpload } from "@/lib/object-storage";
import { MAX_UPLOAD_BYTES, type ImageFormat } from "@/lib/image-utils";

const FORMATS: Record<string, ImageFormat> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "登录后才能上传图片" }, { status: 401 });

  try {
    const body = await request.json() as { contentType?: unknown; size?: unknown };
    const contentType = typeof body.contentType === "string" ? body.contentType : "";
    const size = typeof body.size === "number" ? body.size : 0;
    const format = FORMATS[contentType];
    if (!format) return Response.json({ error: "支持 JPG、PNG、WebP 和 AVIF 格式" }, { status: 415 });
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
      return Response.json({ error: "单张图片不能超过 20MB" }, { status: 413 });
    }
    const key = diaryKeyForUpload(format);
    return Response.json({ key, uploadUrl: await createStorageUploadUrl(key, contentType), maxBytes: MAX_UPLOAD_BYTES });
  } catch (error) {
    console.error("Object storage diary presign failed:", error);
    return Response.json({ error: "暂时无法准备图片上传，请检查对象存储配置" }, { status: 503 });
  }
}
