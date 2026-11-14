import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArchiveCalendar } from "@/components/archive-calendar";
import { ArrowUpRightIcon, LeafIcon } from "@/components/icons";
import { groupByMonth, statsFor } from "@/lib/aggregate";
import {
  excerpt,
  formatDay,
  formatMonthCN,
  formatMonthNote,
  formatMonthTitle,
  formatMonthShort,
  formatTime,
  formatWeekday,
} from "@/lib/format";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "归档",
  description: "把所有日记按时间收好，一年一年，一月一月。",
  alternates: { canonical: "/archive" },
};

export default async function ArchivePage() {
  const posts = await getAllPosts();
  const months = groupByMonth(posts);
  const stats = statsFor(posts);
  const year = months[0]?.key.slice(0, 4) ?? String(SITE.startYear);

  return (
    <div className="archive-page">
      <section className="container archive-hero">
        <span className="mini-label">
          <LeafIcon size={14} />
          ARCHIVE · 所有日子
        </span>
        <h1>
          把走过的日子，
          <br />
          一页一页摞起来。
        </h1>
        <p className="archive-hero__note">
          从第一篇到现在，共 <strong>{stats.entries}</strong> 篇记录、
          <strong>{stats.photos}</strong> 张照片、
          <strong>{stats.words.toLocaleString("zh-CN")}</strong> 个字。
          时间不会停，但翻回来的时候，它还在。
        </p>

        <div className="archive-index" aria-label="按月份跳转">
          {months.map((month) => (
            <a key={month.key} href={`#month-${month.key}`} className="archive-index__item">
              <span>{formatMonthShort(month.posts[0].createdAt)}</span>
              <strong>{formatMonthCN(month.posts[0].createdAt)}</strong>
              <em>{month.posts.length} 篇</em>
            </a>
          ))}
        </div>
      </section>

      <ArchiveCalendar months={months} />

      <section className="container archive-list">
        <div className="archive-list__head">
          <span className="mini-label">THE WHOLE YEAR</span>
          <h2>{year} 年</h2>
        </div>

        {months.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty__art" aria-hidden="true">
              <span className="feed-empty__sun" />
              <span className="feed-empty__hill feed-empty__hill--one" />
              <span className="feed-empty__hill feed-empty__hill--two" />
            </div>
            <h3>还没有可以归档的日子</h3>
            <p>去写下第一篇，明年再回来看。</p>
            <Link href="/compose" className="button button--primary button--small">
              写一篇
            </Link>
          </div>
        ) : (
          months.map((month) => (
            <section
              className="archive-month"
              id={`month-${month.key}`}
              key={month.key}
            >
              <header className="archive-month__head">
                <span className="archive-month__number">
                  {month.key.slice(5)}
                </span>
                <div className="archive-month__title">
                  <h3>{formatMonthTitle(month.key)}</h3>
                  <p>
                    {formatMonthNote(month.key)} · {month.posts.length} 篇
                  </p>
                </div>
                <span className="archive-month__rule" aria-hidden="true" />
              </header>

              <ol className="archive-entries">
                {month.posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/posts/${post.id}`}
                      className="archive-entry"
                      style={
                        {
                          "--entry-accent": post.theme.accent,
                        } as CSSProperties
                      }
                    >
                      <span className="archive-entry__day">
                        <strong>{formatDay(post.createdAt)}</strong>
                        <small>{formatWeekday(post.createdAt)}</small>
                      </span>

                      <span className="archive-entry__main">
                        <span className="archive-entry__title">
                          {post.title || "无题的这一天"}
                        </span>
                        <span className="archive-entry__excerpt">
                          {excerpt(post.content, 96)}
                        </span>
                        <span className="archive-entry__tags">
                          {post.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </span>
                      </span>

                      <span className="archive-entry__side">
                        <span className="archive-entry__time">
                          {formatTime(post.createdAt)}
                        </span>
                        <span
                          className="archive-entry__palette"
                          aria-hidden="true"
                        >
                          {post.theme.palette.slice(0, 3).map((color, index) => (
                            <span
                              key={`${color}-${index}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <ArrowUpRightIcon size={15} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </section>
    </div>
  );
}
