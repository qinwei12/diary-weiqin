import type { Theme } from "./colors";

export type PostImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  accent: string;
  palette: string[];
};

export type Post = {
  id: string;
  title: string;
  content: string;
  images: PostImage[];
  mood: string;
  weather: string;
  location: string;
  tags: string[];
  createdAt: string;
  updatedAt: string | null;
  pinned: boolean;
  likes: number;
  theme: Theme;
};

export type PostSummary = Omit<Post, "content"> & {
  excerpt: string;
  readingMinutes: number;
};

export type PostInputImage = {
  url: string;
  alt?: string;
  width: number;
  height: number;
  palette?: string[];
};

export type SavePostInput = {
  id?: string;
  title: string;
  content: string;
  images: PostInputImage[];
  mood: string;
  weather: string;
  location: string;
  tags: string[];
  createdAt: string;
  pinned: boolean;
};

export type SavePostResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type DiaryStore = {
  version: 1;
  posts: Post[];
};
