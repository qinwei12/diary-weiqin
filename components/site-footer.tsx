import Link from "next/link";
import type { OwnerSession } from "@/lib/auth";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { RssIcon } from "./icons";
import { SITE, SITE_PALETTES } from "@/lib/site";

export async function SiteFooter({
  session,
}: {
  session?: Promise<OwnerSession | null>;
}) {
  const currentSession = session
    ? await session
    : (await connection(), await getSession());
  const isAuthenticated = Boolean(currentSession);
  const icpNumber = process.env.NEXT_PUBLIC_ICP_NUMBER?.trim();

  return (
    <footer className="site-footer">
      <div className="container footer__grid">
        <div className="footer__intro">
          <p className="footer__brand">{SITE.name}</p>
          <p className="footer__tagline">
            {SITE.tagline}
            <span className="footer__spark" aria-hidden="true">
              ✨
            </span>
          </p>
        </div>
        <nav className="footer__links" aria-label="页脚导航">
          <Link href="/">动态</Link>
          <Link href="/archive">归档</Link>
          {isAuthenticated ? <Link href="/album">相册</Link> : null}
          <Link href="/about">关于</Link>
          <Link href="/account">账户</Link>
          <a href="/rss.xml">
            <RssIcon size={14} />
            RSS
          </a>
        </nav>
        <div className="footer__palette">
          <p>界面配色取自日记里的画。</p>
          <div className="footer__swatches" aria-hidden="true">
            {SITE_PALETTES.map((palette) => (
              <span
                key={palette.id}
                style={{ backgroundColor: palette.theme.accent }}
                title={palette.name}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>
          © {SITE.startYear} {SITE.author} · 保留所有心事
        </span>
        {icpNumber ? (
          <a
            className="footer__icp"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>ICP备案号：</span>
            {icpNumber}
          </a>
        ) : null}
        <span className="footer__made">用文字、照片，和一点点晚风。</span>
      </div>
    </footer>
  );
}
