import Image from "next/image";
import Link from "next/link";
import type { DiaryStats } from "@/lib/aggregate";
import { SITE, SITE_PALETTES } from "@/lib/site";
import { ArrowRightIcon, PenIcon, SparkIcon } from "./icons";

function compactNumber(value: number): string {
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function RotatingSeal() {
  return (
    <div className="hero-seal" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <path
            id="seal-text-path"
            d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0"
          />
        </defs>
        <text className="hero-seal__text">
          <textPath href="#seal-text-path" startOffset="0%">
            QUIET WISP · DAILY NOTES · 清微随晚风 ·
          </textPath>
        </text>
        <g className="hero-seal__flower" transform="translate(60 60)">
          <circle r="17" fill="var(--accent)" opacity="0.15" />
          <circle r="3" fill="var(--accent)" />
          {Array.from({ length: 6 }).map((_, index) => (
            <ellipse
              key={index}
              cx="0"
              cy="-9"
              rx="3.2"
              ry="7"
              fill="var(--accent)"
              transform={`rotate(${index * 60})`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function Hero({ stats }: { stats: DiaryStats }) {
  return (
    <section className="hero">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <span className="hero__eyebrow-dot" aria-hidden="true" />
            {SITE.english} · 一个人的日常刊物
          </p>

          <h1 className="hero__title">
            清微随晚风，
            <br />
            温月入
            <span className="hero__highlight">
              云丛
              <svg viewBox="0 0 128 16" aria-hidden="true" preserveAspectRatio="none">
                <path
                  d="M3 11 C 28 4, 66 2, 124 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="hero__description">
            {SITE.description}
          </p>

          <div className="hero__actions">
            <a href="#feed" className="button button--primary">
              读今天的日记
              <ArrowRightIcon size={16} />
            </a>
            <Link href="/compose" className="button button--ghost">
              <PenIcon size={16} />
              写点什么
            </Link>
          </div>

          <p className="hero__note">
            文字 · 照片 · Markdown · 从配图中自动提取主题色
          </p>

          <div className="hero__stats" role="list" aria-label="手记统计">
            <div role="listitem">
              <strong>{stats.entries}</strong>
              <span>篇日记</span>
            </div>
            <div role="listitem">
              <strong>{stats.photos}</strong>
              <span>张照片</span>
            </div>
            <div role="listitem">
              <strong>{compactNumber(stats.words)}</strong>
              <span>个字</span>
            </div>
            <div role="listitem">
              <strong>{stats.tags}</strong>
              <span>个标签</span>
            </div>
          </div>

          <div className="hero__palettes">
            <span className="hero__palettes-label">
              <SparkIcon size={13} />
              界面颜色取自画里的
            </span>
            <div className="hero__palette-dots">
              {SITE_PALETTES.map((palette) => (
                <span
                  key={palette.id}
                  className="hero__palette-dot"
                  style={{ backgroundColor: palette.theme.accent }}
                  title={palette.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hero__visual" aria-label={`${SITE.name} 的画像`}>
          <div className="hero__halo" aria-hidden="true" />
          <div className="hero__dash" aria-hidden="true" />

          <figure className="hero-frame">
            <Image
              src="/images/portrait.webp"
              alt="橙发女孩的半身像，穿着奶油白与橙色相间的裙子"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 900px) 78vw, 400px"
              className="hero-frame__image"
            />
            <figcaption className="hero-frame__caption">
              <strong>{SITE.author}</strong>
              <span>SINCE 2026</span>
            </figcaption>
          </figure>

          <div className="hero-mood">
            <span className="hero-mood__label">今日心情</span>
            <span className="hero-mood__value">🍊 愉快</span>
          </div>

          <figure className="hero-postcard">
            <Image
              src="/images/illustration-window.webp"
              alt="拱形窗外的落日插画"
              width={1200}
              height={900}
              sizes="190px"
            />
            <figcaption>黄昏 · 一幅小画</figcaption>
          </figure>

          <div className="hero-sticker">
            <Image
              src="/images/sticker.webp"
              alt="橙发女孩的贴纸插画"
              width={900}
              height={900}
              sizes="128px"
            />
          </div>

          <RotatingSeal />
        </div>
      </div>
    </section>
  );
}
