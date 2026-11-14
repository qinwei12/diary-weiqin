import { dayKey, excerpt, monthKey, readingMinutes, wordCount } from "./format";
import { moodLabel } from "./site";
import type { Post, PostSummary } from "./types";

export type DayGroup<T = Post> = {
  key: string;
  iso: string;
  posts: T[];
};

export type MonthGroup<T = Post> = {
  key: string;
  posts: T[];
};

export type DiaryStats = {
  entries: number;
  photos: number;
  words: number;
  tags: number;
  likes: number;
};

export function groupByDay<T extends { createdAt: string }>(
  posts: T[],
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const post of posts) {
    const key = dayKey(post.createdAt);
    const last = groups.at(-1);
    if (last && last.key === key) {
      last.posts.push(post);
    } else {
      groups.push({ key, iso: post.createdAt, posts: [post] });
    }
  }
  return groups;
}

export function groupByMonth<T extends { createdAt: string }>(
  posts: T[],
): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  for (const post of posts) {
    const key = monthKey(post.createdAt);
    const last = groups.at(-1);
    if (last && last.key === key) {
      last.posts.push(post);
    } else {
      groups.push({ key, posts: [post] });
    }
  }
  return groups;
}

export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh-CN"));
}

export function statsFor(posts: Post[]): DiaryStats {
  const tags = new Set<string>();
  let photos = 0;
  let words = 0;
  let likes = 0;
  for (const post of posts) {
    photos += post.images.length;
    words += wordCount(post.content);
    likes += post.likes;
    post.tags.forEach((tag) => tags.add(tag));
  }
  return { entries: posts.length, photos, words, tags: tags.size, likes };
}

export function neighbours(posts: Post[], id: string) {
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return { newer: null, older: null };
  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}

export function monthSpan(posts: Post[]): number {
  if (posts.length === 0) return 0;
  const times = posts.map((post) => new Date(post.createdAt).getTime());
  const days = (Math.max(...times) - Math.min(...times)) / 86_400_000;
  return Math.max(1, Math.round(days) + 1);
}

export function summarizePost(post: Post): PostSummary {
  const { content, ...rest } = post;
  return {
    ...rest,
    excerpt: excerpt(content, 190),
    readingMinutes: readingMinutes(content),
  };
}

export function filterPosts(posts: Post[], query: string, tag: string): Post[] {
  const needle = query.trim().toLowerCase();
  return posts.filter((post) => {
    if (tag && !post.tags.includes(tag)) return false;
    if (!needle) return true;
    const haystack = [
      post.title,
      post.content,
      post.tags.join(" "),
      post.weather,
      post.location,
      moodLabel(post.mood),
      post.mood,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
