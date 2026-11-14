import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";
import { safeNextPath } from "@/lib/auth-paths";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "登录",
  description: `${SITE.name} 的主人入口。登录后可以写日记；访客可以自由阅读。`,
  robots: { index: false, follow: false },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="auth-page">
      <div className="container auth-layout">
        <Suspense fallback={<LoginCardSkeleton />}>
          <LoginLoader searchParams={searchParams} />
        </Suspense>

        <aside className="auth-aside" aria-hidden="true">
          <div className="auth-aside__frame">
            <Image
              src="/images/sticker.webp"
              alt=""
              width={900}
              height={900}
              sizes="300px"
              loading="eager"
            />
          </div>
          <p className="auth-aside__quote">
            “晚风不锁门，
            <br />
            只是把写字的笔，收进了抽屉。”
          </p>
          <span className="auth-aside__seal">
            {SITE.chineseName.slice(-1)}
          </span>
        </aside>
      </div>
    </div>
  );
}

async function LoginLoader({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNextPath(rawNext, "/");
  const changed = params.changed === "1";

  return <LoginCard nextPath={next} changed={changed} />;
}

function LoginCard({
  nextPath,
  changed,
}: {
  nextPath: string;
  changed: boolean;
}) {
  return (
    <section className="auth-card">
      <div className="auth-card__head">
        <span className="brand__mark auth-mark">
          <LogoMark />
        </span>
        <span className="mini-label">OWNER&apos;S DOOR · 主人入口</span>
      </div>

      <h1>
        回到 {SITE.name}，
        <br />
        继续写。
      </h1>
      <p className="auth-lead">
        只有主人能发布、编辑和删除日记。访客不必登录，也可以读完这里的每一页。
      </p>

      {changed ? (
        <p className="auth-success" role="status">
          密码已经更新，请用新密码重新登录。
        </p>
      ) : null}

      <LoginForm nextPath={nextPath} />

      <p className="auth-note">
        初始账号为 qinwei。初始密码请登录后在「账户」页修改，改完会退出所有设备。
      </p>
      <div className="auth-links">
        <Link href="/">
          <ArrowLeftIcon size={14} />
          先随便逛逛
        </Link>
        <span>访客模式 · 只读</span>
      </div>
    </section>
  );
}

function LoginCardSkeleton() {
  return (
    <section className="auth-card auth-card--loading" aria-hidden="true">
      <span className="skeleton-bar skeleton-bar--sm" />
      <span className="skeleton-bar skeleton-bar--lg" />
      <span className="skeleton-bar" />
      <span className="skeleton-bar skeleton-bar--md" />
    </section>
  );
}
