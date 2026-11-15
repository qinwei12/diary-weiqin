"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";
import { deleteFromB2 } from "./b2";
import { db } from "./db";
import { albumImages } from "./schema";

export async function deleteAlbumImage(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "登录后才能删除相册照片" };
  if (!/^[a-f0-9-]{20,}$/i.test(id)) return { ok: false, error: "照片地址无效" };

  const [image] = await db.select().from(albumImages).where(eq(albumImages.id, id)).limit(1);
  if (!image) return { ok: false, error: "照片不存在或已经删除" };

  try {
    await deleteFromB2(image.objectKey);
    await db.delete(albumImages).where(eq(albumImages.id, id));
    revalidatePath("/album");
    return { ok: true };
  } catch (error) {
    console.error("Album image deletion failed:", error);
    return { ok: false, error: "删除照片失败，请稍后再试" };
  }
}
