import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";

export async function AuthOnly({ children }: { children: ReactNode }) {
  const session = await getSession();
  return session ? children : null;
}
