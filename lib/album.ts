import { desc } from "drizzle-orm";
import { db } from "./db";
import { createB2DownloadUrl } from "./b2";
import { albumImages } from "./schema";

export type AlbumImage = typeof albumImages.$inferSelect & { url: string };

export async function getAlbumImages(): Promise<AlbumImage[]> {
  const rows = await db.select().from(albumImages).orderBy(desc(albumImages.createdAt));
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      url: await createB2DownloadUrl(row.objectKey, 15 * 60),
    })),
  );
}
