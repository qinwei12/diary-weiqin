import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AuthOnly } from "@/components/auth-only";
import {
  PenIcon,
  RssIcon,
} from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `${SITE.name} 是一本从 2026 年秋天开始写的公开日记。`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="container about-hero">
        <div className="about-hero__copy">
          <span className="mini-label">ABOUT QUIET WISP</span>
          <h1>
            你好，这里是 <strong>{SITE.name}</strong>。
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
            我想把那些容易被忘记的文字、照片和心情留在这里。它不追求频繁更新，也不在意流量，
            只希望多年以后再次推开这扇门时，还能认出当时的生活。
          </p>
          <p className="about-hero__body">
            这个小小的角落，由 Next.js 和 React 搭建，用 Drizzle 与 Neon PostgreSQL 安放日记、账号和图片的信息；
            照片被私密地保存在 iDrive e2，网站则托管在 Vercel。图片上传前会自动压缩，也会从照片里提取颜色，
            让每一页都染上一点那天的气息。
          </p>
          <p className="about-hero__body">
            日记、归档、搜索和 RSS 都向路过的人开放。你可以随意翻看，也可以在某一篇里停留片刻。
          </p>
          <p className="about-hero__body">
            如果这些字恰好被你看完，就当我们在同一阵晚风里坐了一会儿。
          </p>
          <p className="about-hero__sign">— 写于 2026 年的秋天</p>
          <div className="about-hero__actions">
            <Suspense fallback={null}>
              <AuthOnly>
                <Link href="/compose" className="button button--primary">
                  <PenIcon size={16} />
                  写一篇日记
                </Link>
              </AuthOnly>
            </Suspense>
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

    </div>
  );
}
