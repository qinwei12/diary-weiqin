"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { groupByDay } from "@/lib/aggregate";
import {
  buildFeedHref,
  FEED_PAGE_SIZE,
  MAX_FEED_LIMIT,
} from "@/lib/feed";
import {
  formatDay,
  formatMonthCN,
  formatMonthShort,
  formatWeekday,
} from "@/lib/format";
import { toast } from "@/lib/toast";
import type { PostSummary } from "@/lib/types";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CloseIcon,
  PaletteIcon,
  SearchIcon,
} from "./icons";
import { PostCard } from "./post-card";
import { useDiaryTheme } from "./theme-provider";
import { useHydrated } from "./use-hydrated";

export function Feed({
  posts,
  tags,
  total,
  allCount,
  query,
  activeTag,
  limit,
  canWrite,
}: {
  posts: PostSummary[];
  tags: { tag: string; count: number }[];
  total: number;
  allCount: number;
  query: string;
  activeTag: string | null;
  limit: number;
  canWrite: boolean;
}) {
  const { follow: storedFollow, source, applyTheme, setFollow } = useDiaryTheme();
  const follow = useHydrated() ? storedFollow : false;
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const groups = groupByDay(posts);
  const featuredId = posts[0]?.id;
  const visibleKey = posts.map((post) => post.id).join("|");
  const filtering = Boolean(query.trim()) || Boolean(activeTag);
  const hasMore = total > posts.length;
  const nextLimit = Math.min(MAX_FEED_LIMIT, limit + FEED_PAGE_SIZE);

  function navigate(nextQuery: string, nextTag: string | null, nextLimit = FEED_PAGE_SIZE) {
    router.push(buildFeedHref({ q: nextQuery, tag: nextTag, limit: nextLimit }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!follow) return;
    const root = resultsRef.current;
    if (!root) return;

    const byId = new Map(posts.map((post) => [post.id, post]));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.getAttribute("data-post-id");
        if (!id) return;
        const post = byId.get(id);
        if (!post || post.images.length === 0) return;
        setActiveId(id);
        applyTheme(post.theme, `「${post.title || "无题"}」的配图`);
      },
      {
        rootMargin: "-28% 0px -45% 0px",
        threshold: [0, 0.2, 0.5, 0.8],
      },
    );

    root
      .querySelectorAll<HTMLElement>('[data-post-id][data-has-image="true"]')
      .forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [follow, visibleKey, posts, applyTheme]);

  function toggleFollow() {
    if (follow) {
      setFollow(false);
      toast("已固定当前配色");
    } else {
      setFollow(true);
      toast("往下滚动，页面会跟着照片换色", "success");
    }
  }

  return (
    <div className="feed-main">
      <div className="feed-toolbar">
        <form
          className="search-field"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(inputRef.current?.value ?? "", activeTag);
          }}
        >
          <SearchIcon size={17} />
          <input
            key={query}
            ref={inputRef}
            type="search"
            defaultValue={query}
            placeholder="搜索日记、标签或心情…"
            aria-label="搜索日记"
            enterKeyHint="search"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                if (query) navigate("", activeTag);
                else event.currentTarget.blur();
              }
            }}
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => navigate("", activeTag)}
              aria-label="清空搜索"
            >
              <CloseIcon size={14} />
            </button>
          ) : (
            <kbd className="search-kbd" aria-hidden="true">
              /
            </kbd>
          )}
        </form>

        <button
          type="button"
          className={`follow-pill${follow ? " is-on" : ""}`}
          onClick={toggleFollow}
          aria-pressed={follow}
          title="开启后，滚动日记时页面会跟着配图的主色变化"
        >
          <PaletteIcon size={16} />
          <span>跟随配图换色</span>
          <span className="follow-pill__indicator" aria-hidden="true" />
        </button>
      </div>

      <div className="filter-row" role="group" aria-label="按标签筛选">
        <Link
          href={buildFeedHref({ q: query, tag: null, limit: FEED_PAGE_SIZE })}
          className={`filter-chip${activeTag === null ? " is-active" : ""}`}
        >
          全部
          <span>{allCount}</span>
        </Link>
        {tags.map(({ tag, count }) => (
          <Link
            key={tag}
            href={buildFeedHref({
              q: query,
              tag: activeTag === tag ? null : tag,
              limit: FEED_PAGE_SIZE,
            })}
            className={`filter-chip${activeTag === tag ? " is-active" : ""}`}
          >
            #{tag}
            <span>{count}</span>
          </Link>
        ))}
      </div>

      <div className="feed-status">
        <p className="feed-count" aria-live="polite">
          {filtering ? "找到 " : "共 "}
          <strong>{total}</strong> 篇
          {activeTag ? ` · #${activeTag}` : ""}
          {query ? ` · “${query}”` : ""}
        </p>
        {follow ? (
          <p className="feed-follow-note">
            <span className="pulse-dot" aria-hidden="true" />
            {source ? `正在跟随 ${source}` : "滚动页面，让照片决定颜色"}
            <button type="button" onClick={() => setFollow(false)}>
              固定
            </button>
          </p>
        ) : null}
      </div>

      <div className="feed-results" ref={resultsRef}>
        {posts.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty__art" aria-hidden="true">
              <span className="feed-empty__sun" />
              <span className="feed-empty__hill feed-empty__hill--one" />
              <span className="feed-empty__hill feed-empty__hill--two" />
            </div>
            <h3>{allCount === 0 ? "这一页还是空白" : "没有找到这一页"}</h3>
            <p>
              {allCount === 0
                ? "第一篇日记，从今天的心情开始吧。"
                : "换个词，或者把标签清掉再看看。"}
            </p>
            {filtering ? (
              <Link
                href={buildFeedHref({ q: "", tag: null, limit: FEED_PAGE_SIZE })}
                className="button button--primary button--small"
              >
                清除筛选
              </Link>
            ) : canWrite ? (
              <Link href="/compose" className="button button--primary button--small">
                写下第一篇
              </Link>
            ) : null}
          </div>
        ) : (
          groups.map((group) => (
            <section className="day-group" key={group.key}>
              <header className="day-rail">
                <span className="day-rail__number">{formatDay(group.iso)}</span>
                <span className="day-rail__month">
                  {formatMonthShort(group.iso)}
                </span>
                <span className="day-rail__cn">
                  {formatMonthCN(group.iso)} · {formatWeekday(group.iso)}
                </span>
                {group.posts.length > 1 ? (
                  <span className="day-rail__count">{group.posts.length} 篇</span>
                ) : null}
              </header>

              <div className="day-posts">
                {group.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    featured={post.id === featuredId}
                    following={follow && activeId === post.id}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {hasMore ? (
        nextLimit > limit ? (
          <div className="feed-more">
            <Link
              href={buildFeedHref({ q: query, tag: activeTag, limit: nextLimit })}
            >
              再往下翻十篇
              <ChevronDownIcon size={15} />
            </Link>
            <span>
              还有 {total - posts.length} 篇 · 已显示 {posts.length} / {total}
            </span>
          </div>
        ) : (
          <div className="feed-more">
            <Link href="/archive">
              先读到这里，去归档里继续翻
              <ArrowUpRightIcon size={15} />
            </Link>
            <span>还有 {total - posts.length} 篇</span>
          </div>
        )
      ) : null}
    </div>
  );
}
