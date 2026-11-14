import { promises as fs } from "node:fs";
import { excerpt } from "@/lib/format";
import { absoluteImagePath } from "@/lib/image-utils";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function imageType(url: string): string {
  const extension = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "avif":
      return "image/avif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

async function enclosureFor(url: string, base: string) {
  if (/^https:\/\//.test(url)) {
    return { url, type: imageType(url), length: 0 };
  }
  const filePath = absoluteImagePath(url);
  let length = 0;
  if (filePath) {
    try {
      length = (await fs.stat(filePath)).size;
    } catch {
      // Keep the enclosure even if the file disappeared; the feed still valid.
    }
  }
  return {
    url: `${base}${url}`,
    type: imageType(url),
    length,
  };
}

export async function GET() {
  const posts = await getAllPosts();
  const base = SITE.url.replace(/\/$/, "");

  const items = (
    await Promise.all(
      posts.map(async (post) => {
        const link = `${base}/posts/${post.id}`;
        const title =
          post.title || excerpt(post.content, 26) || "无题的这一天";
        const description =
          excerpt(post.content, 240) ||
          post.images.map((image) => image.alt).join("；") ||
          "一页没有文字的日常。";
        const cover = post.images[0];
        const enclosure = cover
          ? await enclosureFor(cover.url, base)
          : null;

        return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
${
  enclosure
    ? `      <enclosure url="${escapeXml(enclosure.url)}" type="${enclosure.type}" length="${enclosure.length}" />`
    : ""
}
    </item>`;
      }),
    )
  ).join("\n");

  const latestTimestamp = posts.reduce((latest, post) => {
    const time = new Date(post.updatedAt ?? post.createdAt).getTime();
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, 0);
  const lastBuildDate = new Date(
    latestTimestamp ||
      new Date(`${SITE.startYear}-01-01T00:00:00+08:00`).getTime(),
  ).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>{escapeXml(SITE.name)}</generator>
    <atom:link href="${escapeXml(`${base}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
