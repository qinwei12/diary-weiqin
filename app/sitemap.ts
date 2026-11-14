import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const base = SITE.url.replace(/\/$/, "");
  const latestPost = posts[0];

  return [
    {
      url: base,
      lastModified: latestPost ? new Date(latestPost.createdAt) : undefined,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/archive`,
      lastModified: latestPost ? new Date(latestPost.createdAt) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...posts.map((post) => ({
      url: `${base}/posts/${post.id}`,
      lastModified: new Date(post.updatedAt ?? post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
