import type { OwnerSession } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import { MobileNavClient } from "./mobile-nav-client";

export async function MobileNav({
  session,
}: {
  session?: Promise<OwnerSession | null>;
}) {
  const currentSession = await (session ?? getSession());
  return <MobileNavClient isAuthenticated={Boolean(currentSession)} />;
}
