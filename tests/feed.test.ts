import { describe, expect, test } from "bun:test";
import { filterPosts, summarizePost } from "../lib/aggregate";
import { buildFeedHref, normalizeFeedLimit } from "../lib/feed";
import { createSeedPosts } from "../lib/seed";

const posts = createSeedPosts();

describe("feed helpers", () => {
  test("normalizes limits into page-sized chunks", () => {
    expect(normalizeFeedLimit(undefined)).toBe(10);
    expect(normalizeFeedLimit(0)).toBe(10);
    expect(normalizeFeedLimit(11)).toBe(20);
    expect(normalizeFeedLimit("25")).toBe(30);
    expect(normalizeFeedLimit(9999)).toBe(100);
  });

  test("builds hash-respecting feed links", () => {
    expect(buildFeedHref({})).toBe("/#feed");
    expect(buildFeedHref({ limit: 10 })).toBe("/#feed");
    const href = buildFeedHref({ q: "黄昏", tag: "秋天", limit: 20 });
    expect(href).toContain("q=%E9%BB%84%E6%98%8F");
    expect(href).toContain("tag=%E7%A7%8B%E5%A4%A9");
    expect(href).toContain("limit=20");
    expect(href.endsWith("#feed")).toBe(true);
  });

  test("filters by content, tag and mood", () => {
    expect(filterPosts(posts, "旧书", "").map((post) => post.id)).toEqual([
      "2026-10-25-old-book",
    ]);
    expect(filterPosts(posts, "", "秋天").length).toBeGreaterThanOrEqual(3);
    expect(filterPosts(posts, "愉快", "").length).toBeGreaterThanOrEqual(1);
    expect(filterPosts(posts, "不存在的词", "")).toHaveLength(0);
  });

  test("summaries contain derived reading data but not the full body", () => {
    const summary = summarizePost(posts[0]);
    expect(summary.excerpt.length).toBeGreaterThan(0);
    expect(summary.readingMinutes).toBeGreaterThan(0);
    expect("content" in summary).toBe(false);
  });
});
