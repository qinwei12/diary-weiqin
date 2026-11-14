"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarIcon, LeafIcon, PenIcon, SparkIcon, UserIcon } from "./icons";

const items = [
  { href: "/", label: "动态", icon: LeafIcon, exact: true },
  { href: "/archive", label: "归档", icon: CalendarIcon },
  { href: "/compose", label: "写下", icon: PenIcon, primary: true },
  {
    href: "/account",
    label: "账户",
    icon: UserIcon,
    match: ["/account", "/login"],
  },
  { href: "/about", label: "关于", icon: SparkIcon },
];

export function MobileNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark the current destination after hydration, keeping the static shell
    // free of client-only navigation state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted ? (
    <ActiveMobileNav />
  ) : (
    <MobileNavLayout pathname={null} />
  );
}

function ActiveMobileNav() {
  const pathname = usePathname();
  return <MobileNavLayout pathname={pathname} />;
}

function MobileNavLayout({ pathname }: { pathname: string | null }) {
  return (
    <nav className="mobile-nav" aria-label="移动端导航">
      {items.map((item) => {
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
