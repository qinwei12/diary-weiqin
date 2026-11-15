import type { OwnerSession } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { SiteHeaderClient } from "./site-header-client";

export async function SiteHeader({
  session,
}: {
  session?: Promise<OwnerSession | null>;
}) {
  const currentSession = await (session ?? getSession());
  return <SiteHeaderClient isAuthenticated={Boolean(currentSession)} />;
}
