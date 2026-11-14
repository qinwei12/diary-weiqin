import "dotenv/config";
import { stat } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { posts, postImages, users, sessions } from "../lib/schema";
import { absoluteImagePath, isHexColor, normalizeDimensions } from "../lib/image-utils";

try {
  const report = await db.transaction(async (tx) => {
    const entries = await tx.select().from(posts);
    const images = await tx.select().from(postImages);
    const owners = await tx.select().from(users);
    const logins = await tx.select().from(sessions);
    const indexes = await tx.execute<{ indexname: string }>(sql`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      AND tablename IN ('Post', 'PostImage', 'User', 'Session')
    `);
    const expectedIndexes = ["Post_pkey", "PostImage_pkey", "User_pkey", "Session_pkey", "Post_createdAt_idx", "PostImage_postId_position_idx", "User_username_key", "Session_tokenHash_key", "Session_userId_idx", "Session_expiresAt_idx"];
    const missingIndexes = expectedIndexes.filter(name => !indexes.rows.some(row => row.indexname === name));
    const missingFiles: string[] = [];
    let externalImages = 0;
    for (const image of images) {
      const file = absoluteImagePath(image.url);
      if (file) {
        const info = await stat(file).catch(() => null);
        if (!info?.isFile() || !info.size) missingFiles.push(image.url);
      } else if (/^https?:\/\//.test(image.url)) externalImages++;
      else missingFiles.push(image.url);
    }
    const ownerUsername = (process.env.OWNER_USERNAME?.trim() || "qinwei").toLowerCase();
    const issues = {
      ownerMissing: !owners.some(owner => owner.username === ownerUsername),
      orphanImages: images.filter(image => !entries.some(post => post.id === image.postId)).length,
      orphanSessions: logins.filter(session => !owners.some(owner => owner.id === session.userId)).length,
      negativeLikes: entries.filter(post => post.likes < 0).length,
      emptyPosts: entries.filter(post => !post.title.trim() && !post.content.trim() && !images.some(image => image.postId === post.id)).length,
      invalidDimensions: images.filter(image => !normalizeDimensions(image.width, image.height)).length,
      invalidColors: images.filter(image => !isHexColor(image.accent) || !image.palette.length || image.palette.some(color => !isHexColor(color))).length,
      invalidImageOrdering: entries.filter(post => images.filter(image => image.postId === post.id).sort((a, b) => a.position - b.position).some((image, index) => image.position !== index)).length,
      postsOverNineImages: entries.filter(post => images.filter(image => image.postId === post.id).length > 9).length,
      invalidPasswordHashFormat: owners.filter(owner => !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(owner.passwordHash)).length,
      invalidSessionHashFormat: logins.filter(session => !/^[a-f0-9]{64}$/.test(session.tokenHash)).length,
      missingIndexes,
      missingFiles,
    };
    return {
      host: new URL(process.env.DATABASE_URL!).hostname,
      counts: { posts: entries.length, images: images.length, users: owners.length, sessions: logins.length },
      issues,
      maintenance: {
        expiredSessions: logins.filter(session => session.expiresAt.getTime() <= Date.now()).length,
        usersMustChangePassword: owners.filter(owner => owner.mustChangePassword).length,
        externalImagesNotFetched: externalImages,
      },
    };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(report.issues).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value))) process.exitCode = 1;
} catch (error) {
  console.error("Database check failed:", error instanceof Error ? error.message.split("\n")[0] : "Unknown error");
  process.exitCode = 1;
} finally {
  await pool.end();
}
