import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { LikeButton } from "@/components/like-button";
import { MarkdownBody } from "@/components/markdown-body";
import { ApplyThemeButton, CopyLinkButton } from "@/components/post-actions";
import { PostMedia } from "@/components/post-media";
import { PostOwnerActions } from "@/components/post-owner-actions";
import { neighbours } from "@/lib/aggregate";
import {
  excerpt,
  formatFullDate,
  formatTime,
  formatWeekday,
  readingMinutes,
  wordCount,
} from "@/lib/format";
import { getAllPosts, getPost } from "@/lib/posts";
import { moodLabel, SITE } from "@/lib/site";
import type { Post } from "@/lib/types";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: post.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/posts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return { title: "这一页走丢了" };
  }
  const title = post.title || excerpt(post.content, 22) || "无题的这一天";
  const description = excerpt(post.content, 110) || `${SITE.name} 里的一页日常。`;
  const cover = post.images[0];

  return {
    title,
    description,
    alternates: { canonical: `/posts/${post.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? post.createdAt,
      tags: post.tags,
      url: `/posts/${post.id}`,
      images: cover
        ? [
            {
              url: cover.url,
              width: cover.width,
              height: cover.height,
              alt: cover.alt,
            },
          ]
        : [
            {
              url: "/images/og.jpg",
              width: 1200,
              height: 630,
              alt: `${SITE.name}：${SITE.tagline}`,
            },
          ],
    },
  };
}

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailLoader params={params} />
    </Suspense>
  );
}

async function PostDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, posts] = await Promise.all([getPost(id), getAllPosts()]);
  if (!post) notFound();
  const { newer, older } = neighbours(posts, post.id);
  return <PostDetail post={post} newer={newer} older={older} />;
}

function PostDetail({
  post,
  newer,
  older,
}: {
  post: Post;
  newer: Post | null;
  older: Post | null;
}) {
  const title = post.title || "无题的这一天";
  const cover = post.images[0];
  const style = {
    "--accent": post.theme.accent,
    "--accent-ink": post.theme.accentInk,
    "--on-accent": post.theme.onAccent,
    "--card-accent": post.theme.accent,
  } as CSSProperties;

  return (
    <article className="post-page" style={style}>
      {cover ? (
        <div className="post-ambient" aria-hidden="true">
          <Image
            src={cover.url}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized={cover.url.startsWith("/api/media?")}
            className="post-ambient__image"
          />
        </div>
      ) : (
        <div className="post-ambient post-ambient--plain" aria-hidden="true" />
      )}

      <div className="container post-page__inner">
        <Link href="/#feed" className="back-link">
          <ArrowLeftIcon size={15} />
          回到动态
        </Link>

        <header className="post-hero">
          <div className="post-hero__meta">
            <time dateTime={post.createdAt}>{formatFullDate(post.createdAt)}</time>
            <span className="meta-dot" aria-hidden="true" />
            <span>
              <span aria-hidden="true">{post.mood}</span> {moodLabel(post.mood)}
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
            {post.pinned ? <span className="post-hero__pin">置顶</span> : null}
          </div>

          <h1 className="post-hero__title">{title}</h1>

          <div className="post-hero__bottom">
            <div className="post-hero__tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
            <p className="post-hero__reading">
              {wordCount(post.content)} 字 · {readingMinutes(post.content)} 分钟阅读
              {post.updatedAt ? " · 有编辑" : ""}
            </p>
          </div>
        </header>

        {post.images.length > 0 ? (
          <div className="post-gallery">
            <PostMedia images={post.images} title={title} variant="detail" />
          </div>
        ) : null}

        <div className="post-content-grid">
          <div className="post-content">
            {post.content ? (
              <MarkdownBody content={post.content} />
            ) : (
              <p className="post-content__empty">这一天只留下了几张照片。</p>
            )}
            <div className="post-endmark" aria-hidden="true">
              <span />
              <em>完</em>
              <span />
            </div>
          </div>

          <aside className="post-aside" aria-label="这一页的配色与操作">
            <section className="post-palette-card">
              <span className="mini-label">PHOTO PALETTE</span>
              <h2>{post.images.length > 0 ? "这篇的颜色" : "默认色板"}</h2>
              <div className="post-palette-swatches" aria-hidden="true">
                {post.theme.palette.slice(0, 6).map((color, index) => (
                  <span
                    key={`${color}-${index}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p>
                {post.images.length > 0
                  ? "这组颜色由封面照片自动提取，点一下可让整个站点跟着换装。"
                  : "这一页没有配图，沿用了站点的默认色板。"}
              </p>
              <ApplyThemeButton theme={post.theme} title={title} />
            </section>

            <section className="post-actions-card">
              <div className="post-actions-card__like">
                <LikeButton
                  key={`${post.id}-${post.likes}`}
                  postId={post.id}
                  initialLikes={post.likes}
                  size="lg"
                  withLabel
                />
                <span>{post.likes > 0 ? "有人喜欢过这一页" : "做第一个喜欢的人"}</span>
              </div>
              <div className="post-actions">
                <CopyLinkButton />
                <Suspense
                  fallback={
                    <span className="post-action post-action--loading" aria-hidden="true" />
                  }
                >
                  <PostOwnerActions postId={post.id} title={title} />
                </Suspense>
              </div>
              {post.updatedAt ? (
                <p className="post-actions-card__edited">
                  最近编辑于{" "}
                  {formatWeekday(post.updatedAt)} {formatTime(post.updatedAt)}
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        <nav className="post-nav" aria-label="相邻日记">
          {older ? (
            <Link href={`/posts/${older.id}`} className="post-nav__item">
              <span className="post-nav__label">
                <ArrowLeftIcon size={14} />
                更早的一篇
              </span>
              <strong>{older.title || "无题的这一天"}</strong>
              <span className="post-nav__date">{formatFullDate(older.createdAt)}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link
              href={`/posts/${newer.id}`}
              className="post-nav__item post-nav__item--next"
            >
              <span className="post-nav__label">
                更新的一篇
                <ArrowRightIcon size={14} />
              </span>
              <strong>{newer.title || "无题的这一天"}</strong>
              <span className="post-nav__date">{formatFullDate(newer.createdAt)}</span>
            </Link>
          ) : null}
        </nav>
      </div>
    </article>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="container post-skeleton" aria-hidden="true">
      <div className="skeleton-bar skeleton-bar--sm" />
      <div className="skeleton-bar skeleton-bar--lg" />
      <div className="skeleton-bar skeleton-bar--md" />
      <div className="post-skeleton__media" />
      <div className="skeleton-bar" />
      <div className="skeleton-bar" />
      <div className="skeleton-bar skeleton-bar--sm" />
    </div>
  );
}
