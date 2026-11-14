import "dotenv/config";
import { promises as fs } from "node:fs";
import { themeFromPalette } from "../lib/colors";
import { count, eq } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { posts as postsTable, postImages, users } from "../lib/schema";
import { hashPassword } from "../lib/password";
import { createSeedPosts } from "../lib/seed";
import type { Post } from "../lib/types";

const FALLBACK_PALETTE = ["#f48251", "#feebe2", "#2b2320"];

async function loadSeedPosts(): Promise<Post[]> {
  try {
    const raw = await fs.readFile("data/posts.json", "utf8");
    const parsed = JSON.parse(raw) as { posts?: Post[] };
    if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
      console.log(
        `Using legacy local entries (${parsed.posts.length}) as seed data.`,
      );
      return parsed.posts;
    }
  } catch {
    // No legacy file; use the bundled demo entries below.
  }
  return createSeedPosts();
}

async function seedOwner() {
  const username = (process.env.OWNER_USERNAME?.trim() || "qinwei").toLowerCase();
  const initialPassword = process.env.OWNER_INITIAL_PASSWORD || "12345";

  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (existing) {
    console.log(`Owner @${username} already exists; password left untouched.`);
    return;
  }

  const passwordHash = await hashPassword(initialPassword);
  await db.insert(users).values({ username, passwordHash, mustChangePassword: true })
    .onConflictDoNothing({ target: users.username });
  console.log(
    `Created owner @${username} with the initial password. Please change it after signing in.`,
  );
}

async function main() {
  await seedOwner();

  const [{ value: existing }] = await db.select({ value: count() }).from(postsTable);
  if (existing > 0) {
    console.log(`Database already contains ${existing} posts; seed skipped.`);
    return;
  }

  const posts = await loadSeedPosts();

  await db.transaction(
    async (tx) => {
      for (const post of posts) {
        const createdAt = new Date(post.createdAt);
        const updatedAt = post.updatedAt ? new Date(post.updatedAt) : null;

        await tx.insert(postsTable).values({
          id: post.id,
          title: post.title ?? "",
          content: post.content ?? "",
          mood: post.mood || "🌿",
          weather: post.weather ?? "",
          location: post.location ?? "",
          tags: Array.isArray(post.tags) ? post.tags.filter(tag => typeof tag === "string") : [],
          createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
          updatedAt: updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null,
          pinned: Boolean(post.pinned),
          likes: Number.isFinite(post.likes) ? Math.max(0, post.likes) : 0,
        });
        const images = (Array.isArray(post.images) ? post.images : []).map((image, index) => {
          const palette = Array.isArray(image.palette) && image.palette.length > 0
            ? image.palette : FALLBACK_PALETTE;
          const theme = themeFromPalette(palette);
          return {
            postId: post.id,
            url: image.url,
            width: Math.max(1, image.width || 4),
            height: Math.max(1, image.height || 3),
            alt: image.alt ?? "",
            accent: theme.accent,
            palette: theme.palette,
            position: index,
          };
        });
        if (images.length) await tx.insert(postImages).values(images);
      }
    },
  );

  console.log(`Seeded ${posts.length} posts into Neon.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
