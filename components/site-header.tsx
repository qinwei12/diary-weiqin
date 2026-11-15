"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MoonIcon, PenIcon, SunIcon, UserIcon } from "./icons";
import { LogoMark } from "./logo-mark";
import { SITE } from "@/lib/site";
import { useDiaryTheme } from "./theme-provider";

const links = [
  { href: "/", label: "动态", exact: true },
  { href: "/archive", label: "归档" },
  { href: "/album", label: "相册" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Active navigation is derived from the client router after hydration; the
    // server render stays static so dynamic post routes can be prerendered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted ? (
    <ActiveHeader />
  ) : (
    <HeaderLayout pathname={null} />
  );
}

function ActiveHeader() {
  const pathname = usePathname();
  return <HeaderLayout pathname={pathname} />;
}

function HeaderLayout({ pathname }: { pathname: string | null }) {
  const { toggleMode } = useDiaryTheme();
  const hideAccount = pathname === "/login" || pathname === "/account";
  const hideWrite =
    pathname === "/compose" || pathname === "/login" || pathname === "/account";

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link
          href="/"
          className="brand"
          aria-label={`${SITE.name} · 回到首页`}
        >
          <span className="brand__mark">
            <LogoMark />
          </span>
          <span className="brand__text">
            <strong>{SITE.name}</strong>
            <small>{SITE.subtitle}</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {links.map((link) => {
            const active = pathname
              ? link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href)
              : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-nav__link${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-actions">
          {hideAccount ? null : (
            <Link
              href="/account"
              className="icon-button header-account"
              aria-label="账户 / 登录"
              title="账户 / 登录"
            >
              <UserIcon size={18} />
            </Link>
          )}
          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggleMode}
            aria-label="切换日间 / 夜间模式"
            title="切换日间 / 夜间模式"
          >
            <span className="theme-toggle__icon theme-toggle__sun">
              <SunIcon size={18} />
            </span>
            <span className="theme-toggle__icon theme-toggle__moon">
              <MoonIcon size={18} />
            </span>
          </button>
          {hideWrite ? null : (
            <Link
              href="/compose"
              className="button button--primary button--small header-write"
              aria-label="写日记"
            >
              <PenIcon size={16} />
              <span>写日记</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
