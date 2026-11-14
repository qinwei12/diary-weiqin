"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost } from "@/lib/actions";
import type { Theme } from "@/lib/colors";
import { toast } from "@/lib/toast";
import { LinkIcon, PaletteIcon, TrashIcon } from "./icons";
import { useDiaryTheme } from "./theme-provider";

export function ApplyThemeButton({
  theme,
  title,
}: {
  theme: Theme;
  title: string;
}) {
  const { applyTheme, setFollow } = useDiaryTheme();

  return (
    <button
      type="button"
      className="button button--small post-palette-card__apply"
      onClick={() => {
        applyTheme(theme, `「${title}」的封面`);
        setFollow(false);
        toast("已经把这组颜色带到全站啦", "success");
      }}
    >
      <PaletteIcon size={15} />
      用到全站
    </button>
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast("链接已复制，去分享这一页吧", "success");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast("复制失败了，可以直接复制地址栏", "error");
    }
  }

  return (
    <button type="button" className="post-action" onClick={copy}>
      <LinkIcon size={16} />
      {copied ? "已复制" : "复制链接"}
    </button>
  );
}

export function DeletePostButton({
  postId,
  title,
}: {
  postId: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deletePost(postId);
      if (!result.ok) {
        toast(result.error ?? "删除失败，请稍后再试", "error");
        setConfirming(false);
        return;
      }
      toast("这一页已经收走了", "success");
      router.push("/");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <span className="delete-confirm">
        <button
          type="button"
          className="delete-confirm__yes"
          onClick={remove}
          disabled={pending}
        >
          {pending ? "正在删除…" : "确认删除"}
        </button>
        <button
          type="button"
          className="delete-confirm__no"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          取消
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="post-action post-action--danger"
      onClick={() => setConfirming(true)}
      title={`删除「${title}」`}
    >
      <TrashIcon size={16} />
      删除
    </button>
  );
}
