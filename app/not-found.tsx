import Link from "next/link";
import { ArrowLeftIcon, PenIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="container not-found">
      <div className="not-found__art" aria-hidden="true">
        <span className="not-found__sun" />
        <span className="not-found__hill" />
        <span className="not-found__path" />
      </div>
      <span className="mini-label">404 · LOST A PAGE</span>
      <h1>这一页走丢了。</h1>
      <p>
        也许它被收进了别的抽屉，或者只是今天还没被写下。
        回到首页，重新翻一翻吧。
      </p>
      <div className="not-found__actions">
        <Link href="/" className="button button--primary">
          <ArrowLeftIcon size={16} />
          回到动态
        </Link>
        <Link href="/compose" className="button button--ghost">
          <PenIcon size={16} />
          写一页新的
        </Link>
      </div>
    </div>
  );
}
