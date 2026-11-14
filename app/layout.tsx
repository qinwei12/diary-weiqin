import type { Metadata, Viewport } from "next";
import { CopyCodeHandler } from "@/components/copy-code-handler";
import { MobileNav } from "@/components/mobile-nav";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import { SITE } from "@/lib/site";
import "./globals.css";

const themeBootScript = `(function(){try{var m=localStorage.getItem("orange-isle:mode");if(m==="dusk"||m==="day"){document.documentElement.dataset.theme=m;}var t=JSON.parse(localStorage.getItem("orange-isle:theme")||"null");if(t&&t.accent){var s=document.documentElement.style;s.setProperty("--accent",t.accent);s.setProperty("--accent-ink",t.accentInk);s.setProperty("--on-accent",t.onAccent);}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  keywords: ["日记", "博客", "日常", "Quiet Wisp", "清微", "晚风", "Markdown", "摄影"],
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE.name}：${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
    images: ["/images/og.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#15100d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      data-theme="day"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          跳到正文
        </a>
        <ThemeProvider>
          <div className="site-shell">
            <SiteHeader />
            <main id="main" className="site-main">
              {children}
            </main>
            <SiteFooter />
          </div>
          <MobileNav />
          <CopyCodeHandler />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
