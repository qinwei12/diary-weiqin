import type { OwnerSession } from "@/lib/auth";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { MobileNavClient } from "./mobile-nav-client";

export async function MobileNav({
  session,
}: {
  session?: Promise<OwnerSession | null>;
}) {
  const currentSession = session
    ? await session
    : (await connection(), await getSession());
  return <MobileNavClient isAuthenticated={Boolean(currentSession)} />;
}
