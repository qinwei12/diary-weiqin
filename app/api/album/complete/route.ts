import { getSession } from "@/lib/auth";
import { createStorageDownloadUrl, deleteFromStorage, isStorageObjectKey } from "@/lib/object-storage";
import { MAX_IMAGE_PIXELS, MAX_UPLOAD_BYTES, normalizeDimensions, normalizePalette } from "@/lib/image-utils";
import { themeFromPalette } from "@/lib/colors";
import { db } from "@/lib/db";
import { albumImages } from "@/lib/schema";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "登录后才能保存相册照片" }, { status: 401 });

  let body: { key?: unknown; width?: unknown; height?: unknown; bytes?: unknown; palette?: unknown; alt?: unknown; caption?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "图片信息不完整" }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  const dimensions = normalizeDimensions(body.width, body.height);
  const bytes = typeof body.bytes === "number" ? body.bytes : 0;
  const palette = normalizePalette(body.palette);
  if (!key.startsWith("album/") || !isStorageObjectKey(key) || !dimensions || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > MAX_UPLOAD_BYTES || !palette) {
    return Response.json({ error: "图片信息不合法" }, { status: 400 });
  }

  const alt = typeof body.alt === "string" ? body.alt.trim().slice(0, 160) : "";
  const caption = typeof body.caption === "string" ? body.caption.trim().slice(0, 240) : "";
  try {
    const [image] = await db.insert(albumImages).values({
      objectKey: key,
      width: dimensions.width,
      height: dimensions.height,
      bytes,
      alt,
      caption,
      accent: themeFromPalette(palette).accent,
      palette,
    }).returning();
    return Response.json({
      image: { ...image, url: await createStorageDownloadUrl(key, 15 * 60) },
    });
  } catch (error) {
    await deleteFromStorage(key).catch((cleanupError) => {
      console.error("Album upload cleanup failed:", cleanupError);
    });
    console.error("Album image save failed:", error);
    return Response.json({ error: "图片保存失败，请重试" }, { status: 500 });
  }
}
