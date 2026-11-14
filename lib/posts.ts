import { cacheLife, cacheTag } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { themeFromPalette } from "./colors";
import { db } from "./db";
import { posts, postImages } from "./schema";
import { DEFAULT_THEME } from "./site";
import type { Post, PostImage } from "./types";

export type { DayGroup, DiaryStats, MonthGroup } from "./aggregate";

type PostWithImages = typeof posts.$inferSelect & { images: (typeof postImages.$inferSelect)[] };

function toPost(row: PostWithImages): Post {
  const images: PostImage[] = [...row.images]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      url: image.url,
      width: image.width,
      height: image.height,
      alt: image.alt,
      accent: image.accent,
      palette: image.palette,
    }));

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    images,
    mood: row.mood,
    weather: row.weather,
    location: row.location,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
    pinned: row.pinned,
    likes: row.likes,
    theme: images[0] ? themeFromPalette(images[0].palette) : DEFAULT_THEME,
  };
}

export async function getAllPosts(): Promise<Post[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("diary");

  const rows = await db.query.posts.findMany({
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
    orderBy: [desc(posts.createdAt)],
  });

  return rows.map(toPost);
}

export async function getPost(id: string): Promise<Post | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("diary");

  const row = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: { images: { orderBy: (image, { asc }) => [asc(image.position)] } },
  });

  return row ? toPost(row) : null;
}
