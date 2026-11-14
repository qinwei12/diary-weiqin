import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { Composer } from "@/components/composer";
import { getSession } from "@/lib/auth";
import { tagCounts } from "@/lib/aggregate";
import { getAllPosts, getPost } from "@/lib/posts";

export const metadata: Metadata = {
  title: "写日记",
  description: "写下一段日常，支持 Markdown、照片与自动取色。",
  robots: { index: false, follow: false },
};

export default function ComposePage({ searchParams }: PageProps<"/compose">) {
  return (
    <Suspense fallback={<ComposeSkeleton />}>
      <ComposeLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function ComposeLoader({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const query = await searchParams;
  const editId = Array.isArray(query.edit) ? query.edit[0] : query.edit;

  await connection();
  const session = await getSession();
  if (!session) {
    const target = editId
      ? `/compose?edit=${encodeURIComponent(editId)}`
      : "/compose";
    redirect(`/login?next=${encodeURIComponent(target)}`);
  }

  const [post, posts] = await Promise.all([
    editId ? getPost(editId) : Promise.resolve(null),
    getAllPosts(),
  ]);

  if (editId && !post) notFound();

  const tagSuggestions = tagCounts(posts)
    .map((item) => item.tag)
    .slice(0, 10);

  return (
    <Composer
      post={post}
      tagSuggestions={tagSuggestions}
      mustChangePassword={session.mustChangePassword}
    />
  );
}

function ComposeSkeleton() {
  return (
    <div className="container compose-skeleton" aria-hidden="true">
      <div className="skeleton-bar skeleton-bar--sm" />
      <div className="skeleton-bar skeleton-bar--lg" />
      <div className="compose-skeleton__grid">
        <div className="compose-skeleton__editor" />
        <div className="compose-skeleton__aside" />
      </div>
    </div>
  );
}
