"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearSessionCookie,
  createSession,
  destroyCurrentSession,
  getSession,
} from "./auth";
import { safeNextPath } from "./auth-paths";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { sessions, users } from "./schema";
import { hashPassword, verifyPassword } from "./password";

export type AuthFormState = { error?: string };

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60_000;
const BLOCK_MS = 60_000;
const MIN_PASSWORD_LENGTH = 6;

type Attempt = {
  count: number;
  last: number;
  blockedUntil: number;
};

// Best-effort protection for a single-process personal site. A multi-instance
// deployment should put a durable rate limiter in front of the login action.
const attempts = new Map<string, Attempt>();
const passwordAttempts = new Map<string, Attempt>();

function pruneAttempts(map: Map<string, Attempt>, now: number) {
  if (map.size < 500) return;
  for (const [key, value] of map) {
    if (value.last < now - ATTEMPT_WINDOW_MS && value.blockedUntil <= now) {
      map.delete(key);
    }
  }
}

async function clientAttemptKey(username: string): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "local";
  return `${ip}|${username}`;
}

function clientMessage(message: string): AuthFormState {
  return { error: message };
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 64);
  const password = String(formData.get("password") ?? "").slice(0, 128);
  const next = safeNextPath(formData.get("next"), "/");

  if (!username || !password) {
    return clientMessage("请输入账号和密码");
  }

  const now = Date.now();
  pruneAttempts(attempts, now);
  const key = await clientAttemptKey(username);
  const attempt = attempts.get(key);
  if (attempt && attempt.blockedUntil > now) {
    const seconds = Math.ceil((attempt.blockedUntil - now) / 1000);
    return clientMessage(`尝试次数过多，请 ${seconds} 秒后再试`);
  }

  let target = next;

  try {
    const user = await db.query.users.findFirst({ where: eq(users.username, username) });
    const valid = user
      ? await verifyPassword(password, user.passwordHash)
      : false;

    if (!user || !valid) {
      const withinWindow = attempt
        ? now - attempt.last < ATTEMPT_WINDOW_MS
        : false;
      const count = (withinWindow ? attempt?.count ?? 0 : 0) + 1;
      const blockedUntil = count >= MAX_ATTEMPTS ? now + BLOCK_MS : 0;
      attempts.set(key, {
        count: blockedUntil ? 0 : count,
        last: now,
        blockedUntil,
      });
      return clientMessage("账号或密码不正确");
    }

    attempts.delete(key);
    await createSession(user.id);

    if (
      user.mustChangePassword &&
      (next === "/" || next === "/account")
    ) {
      target = "/account?first=1";
    }
  } catch (error) {
    console.error("login failed:", error);
    return clientMessage("登录时出了点问题，请稍后再试");
  }

  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}

export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await getSession();
  if (!session) {
    return clientMessage("登录已过期，请重新登录");
  }

  const now = Date.now();
  pruneAttempts(passwordAttempts, now);
  const passwordAttempt = passwordAttempts.get(session.userId);
  if (passwordAttempt?.blockedUntil && passwordAttempt.blockedUntil > now) {
    return clientMessage("密码尝试次数过多，请稍后再试");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "").slice(
    0,
    128,
  );
  const newPassword = String(formData.get("newPassword") ?? "").slice(0, 128);
  const confirmPassword = String(formData.get("confirmPassword") ?? "").slice(
    0,
    128,
  );

  if (!currentPassword || !newPassword || !confirmPassword) {
    return clientMessage("请把三个密码框都填好");
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return clientMessage(`新密码至少需要 ${MIN_PASSWORD_LENGTH} 位`);
  }
  if (newPassword !== confirmPassword) {
    return clientMessage("两次输入的新密码不一致");
  }
  if (newPassword === currentPassword) {
    return clientMessage("新密码不能和当前密码相同");
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: { passwordHash: true },
    });
    if (!user) {
      return clientMessage("账户不存在了，请重新登录");
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      const withinWindow = passwordAttempt
        ? now - passwordAttempt.last < ATTEMPT_WINDOW_MS
        : false;
      const count = (withinWindow ? passwordAttempt?.count ?? 0 : 0) + 1;
      const blockedUntil = count >= MAX_ATTEMPTS ? now + BLOCK_MS : 0;
      passwordAttempts.set(session.userId, {
        count: blockedUntil ? 0 : count,
        last: now,
        blockedUntil,
      });
      return clientMessage(
        blockedUntil
          ? "密码尝试次数过多，请稍后再试"
          : "当前密码不正确",
      );
    }

    passwordAttempts.delete(session.userId);
    const passwordHash = await hashPassword(newPassword);
    await db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash, mustChangePassword: false })
        .where(eq(users.id, session.userId));
      await tx.delete(sessions).where(eq(sessions.userId, session.userId));
    });

    await clearSessionCookie();
  } catch (error) {
    console.error("changePassword failed:", error);
    return clientMessage("修改密码时出了点问题，请稍后再试");
  }

  redirect("/login?changed=1");
}
