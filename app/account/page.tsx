import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PasswordForm } from "@/components/account-forms";
import {
  ArrowUpRightIcon,
  CheckIcon,
  ImageIcon,
  PenIcon,
  SparkIcon,
} from "@/components/icons";
import { logoutAction } from "@/lib/auth-actions";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "账户",
  description: "主人账户与安全设置。",
  robots: { index: false, follow: false },
};

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function AccountLoader({
  searchParams,
}: {
  searchParams: PageProps<"/account">["searchParams"];
}) {
  await connection();
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/account")}`);
  }

  const first = params.first === "1";

  return (
    <AccountView
      username={session.username}
      mustChangePassword={session.mustChangePassword}
      first={first}
    />
  );
}

function AccountView({
  username,
  mustChangePassword,
  first,
}: {
  username: string;
  mustChangePassword: boolean;
  first: boolean;
}) {
  return (
    <div className="account-page">
      <div className="container">
        <header className="account-head">
          <span className="mini-label">OWNER&apos;S DESK · 主人账户</span>
          <h1>你好，{username}。</h1>
          <p>
            这里收着写日记的钥匙。访客仍然可以自由阅读；只有登录后，才会出现发布、编辑和删除的入口。
          </p>
        </header>

        {first || mustChangePassword ? (
          <div className="account-warning" role="status">
            <SparkIcon size={16} />
            <span>
              {`${
                first
                  ? "第一次登录，先把初始密码换掉吧。"
                  : "你还在使用初始密码。"
              }为了这里的安全，建议现在就修改。`}
            </span>
            <a href="#change-password">去修改</a>
          </div>
        ) : null}

        <div className="account-grid">
          <section className="account-card account-profile">
            <div className="account-avatar">
              <Image
                src="/images/avatar.webp"
                alt={`${username} 的头像`}
                width={800}
                height={800}
                sizes="110px"
              />
            </div>
            <h2>{username}</h2>
            <p>这里的主人 · 当前已登录</p>

            <dl className="account-facts">
              <div>
                <dt>账号</dt>
                <dd>{username}</dd>
              </div>
              <div>
                <dt>权限</dt>
                <dd>发布 / 编辑 / 删除</dd>
              </div>
              <div>
                <dt>会话</dt>
                <dd>30 天，已加密存储</dd>
              </div>
            </dl>

            <div className="account-links">
              <Link href="/album">
                <ImageIcon size={15} />
                打开私密相册
              </Link>
              <Link href="/compose">
                <PenIcon size={15} />
                写一篇日记
              </Link>
              <Link href="/">
                回到首页
                <ArrowUpRightIcon size={13} />
              </Link>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="button button--quiet button--small account-logout"
              >
                退出登录
              </button>
            </form>
          </section>

          <section className="account-card" id="change-password">
            <header className="account-card__head">
              <span className="mini-label">SECURITY</span>
              <h2>修改密码</h2>
              <p>
                密码使用 scrypt 哈希保存在数据库里。修改成功后，所有设备上的登录都会失效，需要重新登录。
              </p>
            </header>

            <PasswordForm />

            <p className="account-hint">
              新密码至少 6 位，建议混合大小写、数字和符号。修改后会回到登录页。
            </p>

            <ul className="account-security">
              <li>
                <CheckIcon size={13} />
                Cookie 为 httpOnly，脚本读不到登录凭证
              </li>
              <li>
                <CheckIcon size={13} />
                登录失败 5 次会暂时锁定 1 分钟
              </li>
              <li>
                <CheckIcon size={13} />
                上传图片、发布与删除都需要登录
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="container account-skeleton" aria-hidden="true">
      <span className="skeleton-bar skeleton-bar--sm" />
      <span className="skeleton-bar skeleton-bar--lg" />
      <span className="skeleton-bar skeleton-bar--md" />
      <div className="account-skeleton__grid">
        <span />
        <span />
      </div>
    </div>
  );
}
