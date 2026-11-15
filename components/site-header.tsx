import type { OwnerSession } from "@/lib/auth";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader({
  session,
}: {
  session?: Promise<OwnerSession | null>;
}) {
  const currentSession = session
    ? await session
    : (await connection(), await getSession());
  return <SiteHeaderClient isAuthenticated={Boolean(currentSession)} />;
}
