"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath, updateTag } from "next/cache";
import { getSession } from "./auth";
import { themeFromPalette } from "./colors";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import { posts, postImages } from "./schema";
import {
  absoluteImagePath,
  isManagedImageUrl,
  normalizeDimensions,
  normalizePalette,
  UPLOAD_DIRECTORY,
} from "./image-utils";
import { DEFAULT_THEME } from "./site";
import { deleteFromUpyun, isUpyunImageUrl } from "./upyun";
import type { PostImage, SavePostInput, SavePostResult } from "./types";

class UserError extends Error {}

function userError(message: string): never {
  throw new UserError(message);
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const tag = item
      .replace(/^#+/, "")
      .replace(/[,，\n\r\t]/g, " ")
      .trim()
      .slice(0, 16);
    if (tag) tags.add(tag);
    if (tags.size >= 8) break;
  }
  return [...tags];
}

function safeDate(value: unknown): string {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return new Date().toISOString();
}

function newId(): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `d-${stamp}-${random}`;
}

export async function savePost(input: SavePostInput): Promise<SavePostResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: "登录后才能写日记" };
    }

    if (!input || typeof input !== "object") {
      userError("没有收到日记内容");
    }

    const title = cleanText(input.title, 120);
    const content = cleanText(input.content, 60_000);
    const rawImages = Array.isArray(input.images) ? input.images.slice(0, 9) : [];
    if (!title && !content && rawImages.length === 0) {
      userError("写点什么，或者放一张照片吧");
    }

    const images: PostImage[] = [];
    for (const [index, item] of rawImages.entries()) {
      if (!item || typeof item.url !== "string" || !isManagedImageUrl(item.url)) {
        userError("有一张图片的信息不完整，请重新上传");
      }
      const filePath = absoluteImagePath(item.url);
      if (filePath) {
        try {
          await fs.access(filePath);
        } catch {
          userError("有一张图片已经不在服务器上了，请重新上传");
        }
      } else if (!isUpyunImageUrl(item.url)) {
        userError("图片地址无效，请重新上传");
      }

      const dimensions = normalizeDimensions(item.width, item.height);
      if (!dimensions) {
        userError("有一张图片的尺寸信息不正确，请重新上传");
      }
      const palette = normalizePalette(item.palette) ?? DEFAULT_THEME.palette;
      const imageTheme = themeFromPalette(palette);
      const alt = cleanText(item.alt, 120);
      images.push({
        url: item.url,
        width: dimensions.width,
        height: dimensions.height,
        palette: imageTheme.palette,
        accent: imageTheme.accent,
        alt: alt || `${title || "日记"}的配图 ${index + 1}`,
      });
    }

    const tags = normalizeTags(input.tags);
    const mood =
      typeof input.mood === "string" && input.mood.trim()
        ? input.mood.trim().slice(0, 8)
        : "🌿";
    const weather = cleanText(input.weather, 24);
    const location = cleanText(input.location, 40);
    const createdAt = new Date(safeDate(input.createdAt));
    const pinned = Boolean(input.pinned);
    const imageRows = images.map((image, index) => ({
      ...image,
      position: index,
    }));

    const requestedId =
      typeof input.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(input.id)
        ? input.id
        : null;

    const values = { title, content, mood, weather, location, tags, createdAt, pinned };
    const savedId = requestedId ?? newId();
    await db.transaction(async (tx) => {
      if (requestedId) {
        const [existing] = await tx.update(posts)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(posts.id, requestedId)).returning({ id: posts.id });
        if (!existing) userError("这篇日记已经不存在了");
        await tx.delete(postImages).where(eq(postImages.postId, requestedId));
      } else {
        await tx.insert(posts).values({ id: savedId, ...values });
      }
      if (imageRows.length) {
        await tx.insert(postImages).values(imageRows.map(image => ({ ...image, postId: savedId })));
      }
    });

    updateTag("diary");
    revalidatePath("/", "layout");
    return { ok: true, id: savedId };
  } catch (error) {
    if (error instanceof UserError) {
      return { ok: false, error: error.message };
    }
    console.error("savePost failed:", error);
    return { ok: false, error: "保存时遇到了一点问题，请稍后再试" };
  }
}

export async function deletePost(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: "登录后才能删除日记" };
    }

    if (typeof id !== "string" || !id) userError("缺少日记编号");

    const removed = await db.transaction(async (tx) => {
      const images = await tx.select({ url: postImages.url }).from(postImages).where(eq(postImages.postId, id));
      const [post] = await tx.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
      if (!post) userError("这篇日记已经不存在了");
      return { ...post, images };
    });

    const uploadUrls = [
      ...new Set(
        removed.images
          .map((image) => image.url)
          .filter((url) => url.startsWith("/uploads/")),
      ),
    ];
    if (uploadUrls.length > 0) {
      const stillUsed = await db.select({ url: postImages.url }).from(postImages)
        .where(inArray(postImages.url, uploadUrls));
      const used = new Set(stillUsed.map((image) => image.url));
      for (const url of uploadUrls) {
        if (used.has(url)) continue;
        try {
          await fs.unlink(path.join(UPLOAD_DIRECTORY, path.basename(url)));
        } catch {
          // A missing file should not block removing the entry.
        }
      }
    }
    const remoteUrls = removed.images.map((image) => image.url).filter(isUpyunImageUrl);
    if (remoteUrls.length) {
      const stillUsed = await db.select({ url: postImages.url }).from(postImages)
        .where(inArray(postImages.url, remoteUrls));
      const used = new Set(stillUsed.map((image) => image.url));
      await Promise.all(remoteUrls.filter((url) => !used.has(url)).map(async (url) => {
        try {
          await deleteFromUpyun(url);
        } catch (error) {
          console.error("Upyun image cleanup failed:", error instanceof Error ? error.message : "Unknown error");
        }
      }));
    }

    updateTag("diary");
    revalidatePath("/", "layout");
    revalidatePath("/posts/[id]", "page");
    return { ok: true };
  } catch (error) {
    if (error instanceof UserError) {
      return { ok: false, error: error.message };
    }
    console.error("deletePost failed:", error);
    return { ok: false, error: "删除时遇到了一点问题，请稍后再试" };
  }
}

export async function likePost(
  id: string,
  direction: 1 | -1,
): Promise<{
  ok: boolean;
  likes?: number;
  error?: string;
  authRequired?: boolean;
}> {
  try {
    const session = await getSession();
    if (!session) {
      return {
        ok: false,
        error: "登录后才能喜欢这一页",
        authRequired: true,
      };
    }

    if (typeof id !== "string" || !id) userError("缺少日记编号");
    const step = direction === -1 ? -1 : 1;

    // One atomic statement keeps concurrent taps from clobbering each other.
    const rows = await db.update(posts)
      .set({ likes: sql`GREATEST(0, LEAST(999999, ${posts.likes} + ${step}))` })
      .where(eq(posts.id, id)).returning({ likes: posts.likes });

    const row = rows[0];
    if (!row) userError("这篇日记已经不存在了");

    // Likes are a high-frequency, low-stakes write. Refreshing the whole diary
    // cache (home, archive, RSS, every post) for a single heart would make the
    // remote database do far more work than the interaction is worth. The
    // button reflects the returned count immediately; cached pages catch up on
    // their normal cacheLife revalidation.
    return { ok: true, likes: row.likes };
  } catch (error) {
    if (error instanceof UserError) {
      return { ok: false, error: error.message };
    }
    console.error("likePost failed:", error);
    return { ok: false, error: "暂时没能记下这个喜欢" };
  }
}
