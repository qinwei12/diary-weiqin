import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createStorageDownloadUrl } from "@/lib/object-storage";
import { db } from "@/lib/db";
import { albumImages } from "@/lib/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "登录后才能查看相册" }, { status: 401 });
  const { id } = await params;
  const [image] = await db.select({ objectKey: albumImages.objectKey }).from(albumImages).where(eq(albumImages.id, id)).limit(1);
  if (!image) return Response.json({ error: "照片不存在" }, { status: 404 });
  try {
    return Response.redirect(await createStorageDownloadUrl(image.objectKey, 15 * 60), 302);
  } catch {
    return Response.json({ error: "照片暂时无法读取" }, { status: 404 });
  }
}
