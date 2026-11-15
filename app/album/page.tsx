import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AlbumWall, type AlbumWallImage } from "@/components/album-wall";
import { ArrowLeftIcon, ImageIcon, SparkIcon } from "@/components/icons";
import { getSession } from "@/lib/auth";
import { getAlbumImages } from "@/lib/album";

export const metadata: Metadata = {
  title: "私密相册",
  description: "只对主人开放的生活照片与风景收藏。",
  robots: { index: false, follow: false },
};

export default function AlbumPage() {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumLoader />
    </Suspense>
  );
}

async function AlbumLoader() {
  await connection();
  const session = await getSession();
  if (!session) redirect("/login?next=%2Falbum");

  const images = await getAlbumImages();
  const initialImages: AlbumWallImage[] = images.map((image) => ({
    ...image,
    createdAt: image.createdAt.toISOString(),
  }));

  return (
    <div className="album-page">
      <div className="container album-page__inner">
        <Link href="/" className="back-link"><ArrowLeftIcon size={14} /> 回到动态</Link>
        <header className="album-head">
          <div className="album-head__eyebrow"><ImageIcon size={14} /> PRIVATE PHOTO WALL · 私密相册墙</div>
          <h1>把喜欢的光，<em>留在这里。</em></h1>
          <p>这里不对外公开，只给登录后的你看。生活照、风景照，和那些值得以后再看一遍的瞬间。</p>
          <div className="album-head__note"><SparkIcon size={14} /> B2 私有存储 · 登录后临时授权 · 单张不超过 20MB</div>
        </header>
        <AlbumWall initialImages={initialImages} />
      </div>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <div className="album-page">
      <div className="container album-page__inner">
        <div className="skeleton-bar skeleton-bar--sm" />
        <div className="album-head" aria-hidden="true">
          <div className="skeleton-bar skeleton-bar--sm" />
          <div className="skeleton-bar skeleton-bar--lg" />
          <div className="skeleton-bar skeleton-bar--md" />
        </div>
        <div className="album-wall album-wall--loading" aria-hidden="true">
          <div className="album-grid">
            {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
