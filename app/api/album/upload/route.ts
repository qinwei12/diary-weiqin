import { getSession } from "@/lib/auth";
import { themeFromPalette } from "@/lib/colors";
import { albumKeyForUpload, createB2DownloadUrl, deleteFromB2, uploadToB2 } from "@/lib/b2";
import { db } from "@/lib/db";
import {
  MAX_IMAGE_PIXELS,
  MAX_UPLOAD_BYTES,
  normalizeDimensions,
  normalizePalette,
  sniffImageFormat,
} from "@/lib/image-utils";
import { albumImages } from "@/lib/schema";

export const maxDuration = 60;

type ClientMetadata = {
  width?: unknown;
  height?: unknown;
  palette?: unknown;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "登录后才能上传相册照片" }, { status: 401 });

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES + 1_000_000) {
    return Response.json({ error: "单张相册照片不能超过 20MB" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "无法读取上传内容" }, { status: 400 });
  }

  const value = formData.get("file");
  if (!(value instanceof File) || value.size < 1) {
    return Response.json({ error: "没有选择相册照片" }, { status: 400 });
  }
  if (value.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "单张相册照片不能超过 20MB" }, { status: 413 });
  }

  let metadata: ClientMetadata;
  try {
    const parsed = JSON.parse(String(formData.get("metadata") ?? "null"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("metadata is invalid");
    metadata = parsed as ClientMetadata;
  } catch {
    return Response.json({ error: "图片信息不完整，请重新选择" }, { status: 400 });
  }

  const dimensions = normalizeDimensions(metadata.width, metadata.height);
  const palette = normalizePalette(metadata.palette);
  if (!dimensions || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS || !palette) {
    return Response.json({ error: "图片信息不合法" }, { status: 400 });
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const format = sniffImageFormat(buffer);
  if (!format) return Response.json({ error: "支持 JPG、PNG、WebP 和 AVIF 格式" }, { status: 415 });

  const key = albumKeyForUpload(format);
  try {
    await uploadToB2(buffer, format, key);
    const url = await createB2DownloadUrl(key, 15 * 60);
    const [image] = await db.insert(albumImages).values({
      objectKey: key,
      width: dimensions.width,
      height: dimensions.height,
      bytes: value.size,
      alt: "",
      caption: "",
      accent: themeFromPalette(palette).accent,
      palette,
    }).returning();

    if (!image) throw new Error("Album image insert returned no row");
    return Response.json({ image: { ...image, url } });
  } catch (error) {
    await deleteFromB2(key).catch((cleanupError) => {
      console.error("Album upload cleanup failed:", cleanupError);
    });
    console.error("Album upload failed:", error);
    return Response.json({ error: "图片保存失败，请重试" }, { status: 500 });
  }
}
