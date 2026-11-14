import Link from "next/link";
import { dayKey, formatMonthCN, formatMonthShort, monthKey } from "@/lib/format";
import type { Post } from "@/lib/types";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

export function ArchiveCalendar({
  months,
}: {
  months: { key: string; posts: Post[] }[];
}) {
  if (months.length === 0) return null;

  const year = months[0].key.slice(0, 4);

  return (
    <section className="container archive-rhythm">
      <div className="archive-rhythm__head">
        <div>
          <span className="mini-label">WRITING RHYTHM · {year}</span>
          <h2>今年留下的痕迹</h2>
        </div>
        <p>每一个画上圆点的日子，都有一页日记。</p>
      </div>

      <div className="calendar-grid-wrap">
        {months.map((month) => {
          const [monthYear, monthNumber] = month.key.split("-").map(Number);
          const daysInMonth = new Date(
            Date.UTC(monthYear, monthNumber, 0),
          ).getUTCDate();
          const firstWeekday =
            (new Date(Date.UTC(monthYear, monthNumber - 1, 1)).getUTCDay() + 6) %
            7;
          const byDay = new Map<number, Post>();
          for (const post of month.posts) {
            if (monthKey(post.createdAt) !== month.key) continue;
            const day = Number(dayKey(post.createdAt).slice(8));
            if (!byDay.has(day)) byDay.set(day, post);
          }

          return (
            <div className="calendar-card" key={month.key}>
              <header className="calendar-card__head">
                <span className="calendar-card__short">
                  {formatMonthShort(month.posts[0].createdAt)}
                </span>
                <div>
                  <strong>{formatMonthCN(month.posts[0].createdAt)}</strong>
                  <span>{month.posts.length} 篇</span>
                </div>
              </header>

              <div
                className="calendar-month"
                role="grid"
                aria-label={`${monthNumber} 月写作日历`}
              >
                {weekdays.map((label) => (
                  <span className="calendar-weekday" key={label} role="columnheader">
                    {label}
                  </span>
                ))}
                {Array.from({ length: firstWeekday }).map((_, index) => (
                  <span className="calendar-day is-empty" key={`blank-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const post = byDay.get(day);
                  if (post) {
                    return (
                      <Link
                        key={day}
                        href={`/posts/${post.id}`}
                        className="calendar-day has-post"
                        title={`${day} 日：${post.title || "无题的这一天"}`}
                      >
                        {day}
                      </Link>
                    );
                  }
                  return (
                    <span className="calendar-day" key={day}>
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
