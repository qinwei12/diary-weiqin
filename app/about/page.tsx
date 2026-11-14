import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  PaletteIcon,
  PenIcon,
  RssIcon,
  SparkIcon,
} from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${SITE.name}，和它的主人 ${SITE.author}。`,
  alternates: { canonical: "/about" },
};

const values = [
  {
    title: "日常动态",
    body: "一句话、一张照片、一个小小的坏心情，都可以是一篇。日记不必完整，真实就够了。",
    icon: PenIcon,
  },
  {
    title: "照片与画",
    body: "会放拍坏的照片，也会放认真画了很久的画。每一张图都会参与这一页的配色。",
    icon: PaletteIcon,
  },
  {
    title: "颜色会呼吸",
    body: "界面从配图里自动提取主色。往下滚动时，颜色会跟着照片慢慢换，像一天里的光在变。",
    icon: SparkIcon,
  },
  {
    title: "Markdown",
    body: "标题、引用、列表、代码和链接都能写。排版安静一点，字就更容易被读完。",
    icon: ArrowRightIcon,
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="container about-hero">
        <div className="about-hero__copy">
          <span className="mini-label">ABOUT QUIET WISP</span>
          <h1>
            你好，
            <br />
            我是 {SITE.author}。
          </h1>
          <p className="about-hero__lead">
            一个喜欢晚风、旧书和雨天的人。白天在人群里，晚上回到自己的安静角落。
          </p>
          <p className="about-hero__body">
            「{SITE.name}」是我从 2026 年秋天开始写的一本公开日记。这里没有选题会，也没有
            数据看板，只有一些当时很想留下来的瞬间：窗边的落日、路边的猫、读了一半的书，
            还有突然想起的人。
          </p>
          <p className="about-hero__body">
            如果这些字恰好被你看完，就当我们在同一阵晚风里坐了一会儿。
          </p>
          <p className="about-hero__sign">— 写于 2026 年的秋天</p>
          <div className="about-hero__actions">
            <Link href="/compose" className="button button--primary">
              <PenIcon size={16} />
              写一篇日记
            </Link>
            <a href="/rss.xml" className="button button--ghost">
              <RssIcon size={16} />
              订阅 RSS
            </a>
          </div>
        </div>

        <div className="about-collage" aria-label={`${SITE.name} 的画像与插画`}>
          <div className="about-collage__main">
            <Image
              src="/images/portrait.webp"
              alt="橙发女孩的半身像"
              fill
              sizes="(max-width: 900px) 70vw, 380px"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="about-collage__sticker">
            <Image
              src="/images/sticker.webp"
              alt="橙发女孩的贴纸插画"
              width={900}
              height={900}
              sizes="120px"
            />
          </div>
          <figure className="about-collage__card">
            <Image
              src="/images/illustration-window.webp"
              alt="拱形窗外的落日插画"
              width={1200}
              height={900}
              sizes="190px"
            />
            <figcaption>窗边的黄昏 · 2026</figcaption>
          </figure>
          <div className="about-collage__seal" aria-hidden="true">
            <span>清</span>
            <span>微</span>
          </div>
        </div>
      </section>

      <section className="container about-values">
        <div className="about-section-head">
          <span className="mini-label">WHAT LIVES HERE</span>
          <h2>这个角落收着什么</h2>
        </div>
        <div className="about-values__grid">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <article className="about-value" key={value.title}>
                <div className="about-value__top">
                  <span className="about-value__icon">
                    <Icon size={18} />
                  </span>
                  <span className="about-value__index">0{index + 1}</span>
                </div>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container about-now">
        <div className="about-now__copy">
          <span className="mini-label">NOW · 最近的最近</span>
          <h2>最近的日子是这样过的</h2>
          <p>
            没有宏大的计划，只有一些很小、但确实让日子变好的事情。
          </p>
        </div>
        <ul className="about-now__list">
          <li>
            <span>在读</span>
            <strong>《夜晚的潜水艇》</strong>
            <small>最喜欢《竹峰寺》</small>
          </li>
          <li>
            <span>在听</span>
            <strong>雨声与很慢的钢琴</strong>
            <small>写日记时的固定背景</small>
          </li>
          <li>
            <span>在喝</span>
            <strong>桂花乌龙</strong>
            <small>秋天要喝一点甜的香</small>
          </li>
          <li>
            <span>在学</span>
            <strong>好好记录</strong>
            <small>不着急，慢慢来</small>
          </li>
        </ul>
      </section>

      <section className="container about-credits">
        <span className="about-credits__badge" aria-hidden="true">
          B
        </span>
        <div className="about-credits__copy">
          <span className="mini-label">CREDITS · 元素参考</span>
          <p>
            关于页的版式元素与灵感，参考了哔哩哔哩创作者{" "}
            <strong>@ZipZipPipe</strong> 的作品。
          </p>
        </div>
        <a
          className="about-credits__link"
          href="https://search.bilibili.com/all?keyword=ZipZipPipe"
          target="_blank"
          rel="noopener noreferrer"
        >
          在 B 站看看
          <ArrowUpRightIcon size={14} />
        </a>
      </section>

      <section className="container about-cta">
        <p className="about-cta__quote">
          “清微随晚风，温月入云丛。”
          <span className="about-cta__spark" aria-hidden="true">
            ✨
          </span>
        </p>
        <Link href="/#feed" className="button button--ghost">
          回去读一页
          <ArrowRightIcon size={16} />
        </Link>
      </section>
    </div>
  );
}
