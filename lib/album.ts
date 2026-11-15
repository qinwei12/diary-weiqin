import { desc } from "drizzle-orm";
import { db } from "./db";
import { createStorageDownloadUrl } from "./object-storage";
import { albumImages } from "./schema";

export type AlbumImage = typeof albumImages.$inferSelect & { url: string };

export async function getAlbumImages(): Promise<AlbumImage[]> {
  const rows = await db.select().from(albumImages).orderBy(desc(albumImages.createdAt));
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      url: await createStorageDownloadUrl(row.objectKey, 15 * 60),
    })),
  );
}
