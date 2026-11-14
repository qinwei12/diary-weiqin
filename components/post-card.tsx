"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { formatTime } from "@/lib/format";
import { buildFeedHref, FEED_PAGE_SIZE } from "@/lib/feed";
import { moodLabel } from "@/lib/site";
import { toast } from "@/lib/toast";
import type { PostSummary } from "@/lib/types";
import { ArrowUpRightIcon, PaletteIcon, PinIcon } from "./icons";
import { LikeButton } from "./like-button";
import { PostMedia } from "./post-media";
import { useDiaryTheme } from "./theme-provider";

export function PostCard({
  post,
  featured = false,
  following = false,
}: {
  post: PostSummary;
  featured?: boolean;
  following?: boolean;
}) {
  const { theme, applyTheme, setFollow } = useDiaryTheme();
  const title = post.title || "无题的这一天";
  const style = {
    "--card-accent": post.theme.accent,
    "--card-accent-ink": post.theme.accentInk,
  } as CSSProperties;

  function pickColor() {
    applyTheme(post.theme, `「${title}」的配图`);
    setFollow(false);
    toast("已用这篇配图的颜色换肤", "success");
  }

  return (
    <article
      id={`post-${post.id}`}
      className={`post-card${featured ? " post-card--featured" : ""}${
        following ? " is-following" : ""
      }`}
      data-post-id={post.id}
      data-follow-card
      data-has-image={post.images.length > 0}
      style={style}
    >
      {following ? (
        <span className="post-card__following">
          <span className="pulse-dot" aria-hidden="true" />
          正在用这张配图为页面取色
        </span>
      ) : null}

      <header className="post-card__head">
        <div className="post-card__meta">
          <time dateTime={post.createdAt} className="post-card__time">
            {formatTime(post.createdAt)}
          </time>
          <span className="meta-dot" aria-hidden="true" />
          <span className="post-card__mood">
            <span aria-hidden="true">{post.mood}</span>
            {moodLabel(post.mood)}
          </span>
          {post.weather ? (
            <>
              <span className="meta-dot" aria-hidden="true" />
              <span>{post.weather}</span>
            </>
          ) : null}
          {post.location ? (
            <>
              <span className="meta-dot" aria-hidden="true" />
              <span>{post.location}</span>
            </>
          ) : null}
        </div>
        {post.pinned ? (
          <span className="post-card__pin">
            <PinIcon size={12} />
            置顶
          </span>
        ) : null}
      </header>

      <div className="post-card__body">
        <div className="post-card__text">
          <h3 className="post-card__title">
            <Link href={`/posts/${post.id}`}>{title}</Link>
          </h3>
          {post.images.length > 0 ? (
            <p className="post-card__excerpt">
              {post.excerpt || "这一页只放了图片。"}
            </p>
          ) : (
            <blockquote className="post-card__quote">
              <span aria-hidden="true">“</span>
              <span>{post.excerpt || "这一页只留下了一阵风。"}</span>
            </blockquote>
          )}
          {post.tags.length > 0 ? (
            <div className="post-card__tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={buildFeedHref({ tag, limit: FEED_PAGE_SIZE })}
                  className="tag"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {post.images.length > 0 ? (
          <PostMedia images={post.images} title={title} variant="card" />
        ) : null}
      </div>

      <footer className="post-card__foot">
        <div className="post-card__foot-left">
          <LikeButton
            key={`${post.id}-${post.likes}`}
            postId={post.id}
            initialLikes={post.likes}
            size="sm"
          />
          <span className="post-card__reading">
            {post.readingMinutes} 分钟阅读
          </span>
        </div>

        <div className="post-card__foot-right">
          <button
            type="button"
            className="post-card__palette"
            onClick={pickColor}
            aria-label="用这篇日记的配图颜色给页面换肤"
            title="用这篇日记的配图颜色给页面换肤"
          >
            <PaletteIcon size={14} />
            <span className="post-card__palette-dots" aria-hidden="true">
              {post.theme.palette.slice(0, 4).map((color, index) => (
                <span
                  key={`${post.id}-${color}-${index}`}
                  style={{ backgroundColor: color }}
                  className={
                    theme.accent.toLowerCase() === color.toLowerCase()
                      ? "is-current"
                      : undefined
                  }
                />
              ))}
            </span>
          </button>

          <Link href={`/posts/${post.id}`} className="post-card__read">
            阅读全文
            <ArrowUpRightIcon size={15} />
          </Link>
        </div>
      </footer>
    </article>
  );
}
