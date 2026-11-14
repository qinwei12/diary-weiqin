"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/auth-actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    {},
  );

  return (
    <form action={formAction} className="auth-form account-form">
      <label className="auth-field">
        <span>当前密码</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
      </label>

      <label className="auth-field">
        <span>新密码 · 至少 6 位</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={128}
          required
        />
      </label>

      <label className="auth-field">
        <span>再输一次新密码</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={128}
          required
        />
      </label>

      {state.error ? (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button--primary button--small"
        disabled={pending}
      >
        {pending ? "正在更新…" : "更新密码"}
      </button>
    </form>
  );
}
