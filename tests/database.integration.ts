// Explicit opt-in: bun run test:db. Creates isolated test records and removes them.
import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { posts, postImages, sessions, users } from "../lib/schema";
import { hashPassword, verifyPassword } from "../lib/password";
import { createSeedPosts } from "../lib/seed";
import type { SavePostInput } from "../lib/types";
import { deleteFromStorage, isStorageProxyImageUrl, storageKeyFromProxyUrl } from "../lib/object-storage";

const cookieJar = new Map<string, string>();
mock.module("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.has(name) ? { value: cookieJar.get(name)! } : undefined,
    set: (name: string, value: string) => { cookieJar.set(name, value); },
  }),
  headers: async () => new Headers(),
}));
mock.module("next/cache", () => ({ revalidatePath() {}, updateTag() {}, cacheLife() {}, cacheTag() {} }));
mock.module("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));

const { savePost, deletePost, likePost } = await import("../lib/actions");
const { getAllPosts, getPost } = await import("../lib/posts");
const { createSession, getSession, destroyCurrentSession, SESSION_COOKIE } = await import("../lib/auth");
const { loginAction, changePasswordAction } = await import("../lib/auth-actions");
const { POST: uploadImage } = await import("../app/api/upload/route");
const testId = `test-${randomUUID()}`;
const testPosts = new Set<string>();
const password = `test-password-${randomUUID()}`;
let id = "";
const seed = createSeedPosts().find(post => post.images.length > 0)!;
const input: SavePostInput = { title: "Database integration test", content: "Test content", images: [seed.images[0]], tags: ["migration"], mood: "🌿", weather: "晴", location: "测试", createdAt: new Date().toISOString(), pinned: false };

beforeAll(async () => {
  await db.insert(users).values({ id: testId, username: testId, passwordHash: await hashPassword(password) });
  await createSession(testId);
});
afterAll(async () => {
  try {
    if (testPosts.size) await db.delete(posts).where(inArray(posts.id, [...testPosts]));
    await db.delete(users).where(eq(users.id, testId));
  } finally { await pool.end(); }
});

test("anonymous writes are rejected", async () => {
  const token = cookieJar.get(SESSION_COOKIE)!;
  cookieJar.delete(SESSION_COOKIE);
  expect(await savePost(input)).toMatchObject({ ok: false });
  expect(await deletePost("nonexistent")).toMatchObject({ ok: false });
  expect(await likePost("nonexistent", 1)).toMatchObject({ ok: false, authRequired: true });
  cookieJar.set(SESSION_COOKIE, token);
});

test("create and relational reads preserve dates, arrays, images and defaults", async () => {
  const result = await savePost(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error);
  id = result.id;
  testPosts.add(id);
  const row = await getPost(id);
  expect(row).toMatchObject({ title: input.title, content: input.content, tags: ["migration"], likes: 0, updatedAt: null });
  expect(row?.images).toHaveLength(1);
  expect(row?.createdAt).toBe(input.createdAt);
  expect((await getAllPosts()).some(post => post.id === id)).toBe(true);
});

test("edit replaces image rows atomically and leaves likes intact", async () => {
  await likePost(id, 1);
  expect(await savePost({ ...input, id, title: "Edited", images: [seed.images[0], seed.images[0]] })).toMatchObject({ ok: true, id });
  const row = await getPost(id);
  expect(row?.images).toHaveLength(2);
  expect(row?.likes).toBe(1);
  expect(row?.updatedAt).not.toBeNull();
  expect(await savePost({ ...input, id, images: [] })).toMatchObject({ ok: true });
  expect((await getPost(id))?.images).toHaveLength(0);
});

test("concurrent likes are atomic and respect both limits", async () => {
  await db.update(posts).set({ likes: 0 }).where(eq(posts.id, id));
  await Promise.all(Array.from({ length: 6 }, () => likePost(id, 1)));
  expect((await getPost(id))?.likes).toBe(6);
  await db.update(posts).set({ likes: 0 }).where(eq(posts.id, id));
  expect(await likePost(id, -1)).toMatchObject({ ok: true, likes: 0 });
  await db.update(posts).set({ likes: 999999 }).where(eq(posts.id, id));
  expect(await likePost(id, 1)).toMatchObject({ ok: true, likes: 999999 });
});

test("a failed multi-table transaction rolls back the post update", async () => {
  const before = await getPost(id);
  await expect(db.transaction(async tx => {
    await tx.update(posts).set({ title: "Must roll back" }).where(eq(posts.id, id));
    await tx.insert(postImages).values({ postId: `missing-${testId}`, url: seed.images[0].url, width: 1, height: 1, accent: "#123456", palette: ["#123456"] });
  })).rejects.toThrow();
  expect((await getPost(id))?.title).toBe(before?.title);
});

test("authenticated upload stores an image in object storage and returns an internal proxy URL", async () => {
  const file = new File([await Bun.file("public/images/sticker.webp").arrayBuffer()], "test.webp", { type: "image/webp" });
  const form = new FormData();
  form.append("files", file);
  form.append("metadata", JSON.stringify([{ width: 320, height: 320, palette: seed.images[0].palette }]));
  const response = await uploadImage(new Request("http://localhost/api/upload", { method: "POST", body: form }));
  expect(response.status).toBe(200);
  let imageUrl = "";
  let savedId: string | null = null;
  try {
    const result = await response.json() as { images: Array<{ url: string; width: number; height: number; accent: string; palette: string[] }> };
    expect(result.images).toHaveLength(1);
    imageUrl = result.images[0].url;
    expect(isStorageProxyImageUrl(imageUrl)).toBe(true);
    const saved = await savePost({ ...input, images: [{ ...input.images[0], ...result.images[0] }] });
    if (!saved.ok) throw new Error(saved.error);
    savedId = saved.id;
    testPosts.add(savedId);
    expect((await getPost(savedId))?.images[0].url).toBe(imageUrl);
    expect(await deletePost(savedId)).toEqual({ ok: true });
    testPosts.delete(savedId);
    expect(await getPost(savedId)).toBeNull();
  } finally {
    const key = imageUrl ? storageKeyFromProxyUrl(imageUrl) : null;
    if (key && !savedId) await deleteFromStorage(key);
  }
});

test("delete cascades to images; editing or liking a missing post fails", async () => {
  await savePost({ ...input, id });
  expect(await deletePost(id)).toEqual({ ok: true });
  expect(await getPost(id)).toBeNull();
  expect(await db.select().from(postImages).where(eq(postImages.postId, id))).toHaveLength(0);
  expect(await savePost({ ...input, id })).toMatchObject({ ok: false });
  expect(await likePost(id, 1)).toMatchObject({ ok: false });
});

test("login creates a session and changing a password invalidates every session", async () => {
  await destroyCurrentSession();
  expect(await getSession()).toBeNull();
  const login = new FormData();
  login.set("username", testId);
  login.set("password", password);
  await expect(loginAction({}, login)).rejects.toThrow("redirect:/");
  expect((await getSession())?.userId).toBe(testId);
  const extraToken = createHash("sha256").update(randomUUID()).digest("hex");
  await db.insert(sessions).values({ userId: testId, tokenHash: extraToken, expiresAt: new Date(Date.now() + 60000) });
  const change = new FormData();
  change.set("currentPassword", password);
  change.set("newPassword", `${password}-changed`);
  change.set("confirmPassword", `${password}-changed`);
  await expect(changePasswordAction({}, change)).rejects.toThrow("redirect:/login?changed=1");
  expect(await db.select().from(sessions).where(eq(sessions.userId, testId))).toHaveLength(0);
  const account = await db.query.users.findFirst({ where: eq(users.id, testId) });
  expect(await verifyPassword(`${password}-changed`, account!.passwordHash)).toBe(true);
  expect(await verifyPassword(password, account!.passwordHash)).toBe(false);
  expect(await getSession()).toBeNull();
});
