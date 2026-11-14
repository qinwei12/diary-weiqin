import Image from "next/image";
import Link from "next/link";
import { formatDay, formatMonthShort } from "@/lib/format";
import { buildFeedHref, FEED_PAGE_SIZE } from "@/lib/feed";
import { SITE, SITE_PALETTES } from "@/lib/site";
import type { PostSummary } from "@/lib/types";
import { ArrowUpRightIcon, LeafIcon, RssIcon, TagIcon } from "./icons";
import { PalettePicker } from "./palette-picker";

export function FeedSidebar({
  posts,
  tags,
}: {
  posts: PostSummary[];
  tags: { tag: string; count: number }[];
}) {
  return (
    <aside className="feed-aside" aria-label="侧栏">
      <section className="side-card side-card--palette">
        <header className="side-card__head">
          <span className="side-card__label">
            <LeafIcon size={14} />
            COLOR FOLLOWS THE PHOTO
          </span>
          <h2>色彩档案</h2>
        </header>
        <PalettePicker palettes={SITE_PALETTES} />
      </section>

      <section className="side-card">
        <header className="side-card__head">
          <span className="side-card__label">
            <TagIcon size={14} />
            TAGS
          </span>
          <h2>标签索引</h2>
        </header>
        <div className="tag-cloud">
          {tags.slice(0, 14).map(({ tag, count }) => (
            <Link
              key={tag}
              href={buildFeedHref({ tag, limit: FEED_PAGE_SIZE })}
              className="tag-cloud__item"
              title={`筛选 #${tag}（${count} 篇）`}
            >
              #{tag}
              <sup>{count}</sup>
            </Link>
          ))}
        </div>
      </section>

      <section className="side-card">
        <header className="side-card__head">
          <span className="side-card__label">RECENTLY</span>
          <h2>最近写过</h2>
        </header>
        <ol className="recent-list">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`} className="recent-item">
                <span className="recent-item__date">
                  <strong>{formatDay(post.createdAt)}</strong>
                  <small>{formatMonthShort(post.createdAt)}</small>
                </span>
                <span className="recent-item__title">
                  {post.title || "无题的这一天"}
                </span>
                <ArrowUpRightIcon size={14} />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="side-card side-card--about">
        <div className="side-card__avatar">
          <Image
            src="/images/avatar.webp"
            alt={`${SITE.name}的头像`}
            width={800}
            height={800}
            sizes="96px"
          />
        </div>
        <p className="side-card__quote">
          这里没有算法，只有时间、照片和一点点心情。
        </p>
        <p className="side-card__sign">— {SITE.author}</p>
        <div className="side-card__links">
          <Link href="/about">
            关于这个角落
            <ArrowUpRightIcon size={13} />
          </Link>
          <a href="/rss.xml">
            <RssIcon size={14} />
            RSS
          </a>
        </div>
      </section>
    </aside>
  );
}
