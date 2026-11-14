import Link from "next/link";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { PenIcon } from "./icons";
import { DeletePostButton } from "./post-actions";

export async function PostOwnerActions({
  postId,
  title,
}: {
  postId: string;
  title: string;
}) {
  await connection();
  const session = await getSession();

  if (!session) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/posts/${postId}`)}`}
        className="post-action post-owner-login"
      >
        <PenIcon size={16} />
        登录后可编辑
      </Link>
    );
  }

  return (
    <>
      <Link href={`/compose?edit=${postId}`} className="post-action">
        <PenIcon size={16} />
        编辑
      </Link>
      <DeletePostButton postId={postId} title={title} />
    </>
  );
}
