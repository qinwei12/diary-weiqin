"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { likePost } from "@/lib/actions";
import { toast } from "@/lib/toast";
import { HeartIcon } from "./icons";

export function LikeButton({
  postId,
  initialLikes,
  size = "md",
  withLabel = false,
}: {
  postId: string;
  initialLikes: number;
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    try {
      // The liked state lives in localStorage, so it can only be restored after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiked(window.localStorage.getItem(`orange-isle:like:${postId}`) === "1");
    } catch {
      // Ignore storage failures.
    }
  }, [postId]);

  async function toggle() {
    if (pending) return;
    const next = !liked;
    const previousLikes = likes;
    setLiked(next);
    setLikes(Math.max(0, likes + (next ? 1 : -1)));
    setPending(true);
    try {
      window.localStorage.setItem(
        `orange-isle:like:${postId}`,
        next ? "1" : "0",
      );
    } catch {
      // Ignore storage failures.
    }

    const result = await likePost(postId, next ? 1 : -1);
    setPending(false);

    if (!result.ok) {
      setLiked(!next);
      setLikes(previousLikes);
      try {
        window.localStorage.setItem(
          `orange-isle:like:${postId}`,
          next ? "0" : "1",
        );
      } catch {
        // Ignore storage failures.
      }

      if (result.authRequired) {
        toast("登录后才能喜欢这一页");
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
        return;
      }

      toast(result.error ?? "暂时没能记下这个喜欢", "error");
      return;
    }

    if (typeof result.likes === "number") setLikes(result.likes);
    if (next) toast("把这一页收进了喜欢里", "success");
  }

  const iconSize = size === "lg" ? 20 : size === "sm" ? 15 : 17;

  return (
    <button
      type="button"
      className={`like-button like-button--${size}${liked ? " is-liked" : ""}`}
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? `取消喜欢，当前 ${likes} 个喜欢` : `喜欢这篇日记，当前 ${likes} 个喜欢`}
      disabled={pending}
    >
      <HeartIcon size={iconSize} filled={liked} />
      <span className="like-button__count">{likes}</span>
      {withLabel ? <span className="like-button__label">喜欢</span> : null}
    </button>
  );
}
