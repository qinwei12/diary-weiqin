import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Feed } from "@/components/feed";
import { FeedSidebar } from "@/components/feed-sidebar";
import { Hero } from "@/components/hero";
import { AuthOnly } from "@/components/auth-only";
import { ArrowRightIcon, LeafIcon, PenIcon } from "@/components/icons";
import {
  filterPosts,
  statsFor,
  summarizePost,
  tagCounts,
} from "@/lib/aggregate";
import { normalizeFeedLimit } from "@/lib/feed";
import { getSession } from "@/lib/auth";
import { getAllPosts } from "@/lib/posts";

type HomeSearchParams = PageProps<"/">["searchParams"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const posts = await getAllPosts();
  const stats = statsFor(posts);
  const tags = tagCounts(posts);
  const recent = posts.slice(0, 3).map(summarizePost);

  return (
    <div className="home">
      <Hero stats={stats} />

      <section className="container feed-section" id="feed">
        <div className="feed-heading">
          <div className="feed-heading__title">
            <span className="mini-label">
              <LeafIcon size={14} />
              THE DAILY · 日常动态
            </span>
            <h2>最近的日常</h2>
          </div>
          <p className="feed-heading__note">
            从最近的黄昏开始读起。搜索一个词、按标签筛选，或者让照片替页面换一种颜色。
          </p>
        </div>

        <div className="feed-layout">
          <Suspense fallback={<FeedSkeleton />}>
            <HomeFeed
              searchParams={searchParams}
              tags={tags}
              allCount={posts.length}
            />
          </Suspense>
          <FeedSidebar posts={recent} tags={tags} />
        </div>
      </section>

      <section className="container home-cta">
        <div className="home-cta__flower" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="home-cta__copy">
          <span className="mini-label">A NOTE TO TOMORROW</span>
          <h2>今天，也值得被记下来。</h2>
          <p>不必写得很好。一句话、一张照片，或者只是一个当下的心情，都算数。</p>
        </div>
        <Suspense fallback={null}>
          <AuthOnly>
            <Link href="/compose" className="button button--primary">
              <PenIcon size={16} />
              写下此刻
              <ArrowRightIcon size={16} />
            </Link>
          </AuthOnly>
        </Suspense>
      </section>
    </div>
  );
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function HomeFeed({
  searchParams,
  tags,
  allCount,
}: {
  searchParams: HomeSearchParams;
  tags: { tag: string; count: number }[];
  allCount: number;
}) {
  const params = await searchParams;
  const query = firstParam(params.q).trim().slice(0, 80);
  const tag = firstParam(params.tag).trim().slice(0, 16);
  const limit = normalizeFeedLimit(firstParam(params.limit));
  await connection();
  const canWrite = Boolean(await getSession());

  const posts = await getAllPosts();
  const matched = filterPosts(posts, query, tag);
  const visible = matched.slice(0, limit).map(summarizePost);

  return (
    <Feed
      posts={visible}
      tags={tags}
      total={matched.length}
      allCount={allCount}
      query={query}
      activeTag={tag || null}
      limit={limit}
      canWrite={canWrite}
    />
  );
}

function FeedSkeleton() {
  return (
    <div className="feed-main" aria-hidden="true">
      <div className="feed-skeleton">
        <span className="skeleton-bar skeleton-bar--md" />
        <span className="skeleton-bar" />
        <div className="feed-skeleton__cards">
          <span className="feed-skeleton__card" />
          <span className="feed-skeleton__card" />
        </div>
      </div>
    </div>
  );
}
