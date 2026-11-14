import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Keep the existing SQL names and IDs so data can move without rewriting links.
export const posts = pgTable("Post", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default(""),
  content: text("content").notNull(),
  mood: text("mood").notNull().default("🌿"),
  weather: text("weather").notNull().default(""),
  location: text("location").notNull().default(""),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3 }),
  pinned: boolean("pinned").notNull().default(false),
  likes: integer("likes").notNull().default(0),
}, (table) => [index("Post_createdAt_idx").on(table.createdAt.desc())]);

export const postImages = pgTable("PostImage", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  postId: text("postId").notNull().references(() => posts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  url: text("url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  alt: text("alt").notNull().default(""),
  accent: text("accent").notNull(),
  palette: text("palette").array().notNull(),
  position: integer("position").notNull().default(0),
}, (table) => [index("PostImage_postId_position_idx").on(table.postId, table.position)]);

export const users = pgTable("User", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  username: text("username").notNull(),
  passwordHash: text("passwordHash").notNull(),
  mustChangePassword: boolean("mustChangePassword").notNull().default(false),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex("User_username_key").on(table.username)]);

export const sessions = pgTable("Session", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  tokenHash: text("tokenHash").notNull(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  expiresAt: timestamp("expiresAt", { precision: 3 }).notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("Session_tokenHash_key").on(table.tokenHash),
  index("Session_userId_idx").on(table.userId),
  index("Session_expiresAt_idx").on(table.expiresAt),
]);

export const postsRelations = relations(posts, ({ many }) => ({ images: many(postImages) }));
export const postImagesRelations = relations(postImages, ({ one }) => ({
  post: one(posts, { fields: [postImages.postId], references: [posts.id] }),
}));
export const usersRelations = relations(users, ({ many }) => ({ sessions: many(sessions) }));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
