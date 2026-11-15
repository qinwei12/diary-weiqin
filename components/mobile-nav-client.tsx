"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, ImageIcon, LeafIcon, PenIcon, SparkIcon, UserIcon } from "./icons";

const items = [
  { href: "/", label: "动态", icon: LeafIcon, exact: true },
  { href: "/archive", label: "归档", icon: CalendarIcon },
  { href: "/album", label: "相册", icon: ImageIcon, requiresAuth: true },
  { href: "/compose", label: "写下", icon: PenIcon, primary: true, requiresAuth: true },
  {
    href: "/account",
    label: "账户",
    icon: UserIcon,
    match: ["/account", "/login"],
  },
  { href: "/about", label: "关于", icon: SparkIcon },
];

export function MobileNavClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark the current destination after hydration, keeping the static shell
    // free of client-only navigation state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted ? (
    <ActiveMobileNav isAuthenticated={isAuthenticated} />
  ) : (
    <MobileNavLayout pathname={null} isAuthenticated={isAuthenticated} />
  );
}

function ActiveMobileNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  return <MobileNavLayout pathname={pathname} isAuthenticated={isAuthenticated} />;
}

function MobileNavLayout({
  pathname,
  isAuthenticated,
}: {
  pathname: string | null;
  isAuthenticated: boolean;
}) {
  return (
    <nav className="mobile-nav" aria-label="移动端导航">
      {items.map((item) => {
        if (item.requiresAuth && !isAuthenticated) return null;
        const matches = item.match ?? [item.href];
        const active = pathname
          ? item.exact
            ? pathname === item.href
            : matches.some((href) => pathname.startsWith(href))
          : false;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav__item${active ? " is-active" : ""}${
              item.primary ? " mobile-nav__item--primary" : ""
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-nav__icon">
              <Icon size={item.primary ? 20 : 19} />
            </span>
            <span className="mobile-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
