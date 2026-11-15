import type { ReactNode } from "react";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";

export async function AuthOnly({ children }: { children: ReactNode }) {
  await connection();
  const session = await getSession();
  return session ? children : null;
}
