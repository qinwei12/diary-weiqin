"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { ArrowRightIcon } from "./icons";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />

      <label className="auth-field">
        <span>账号</span>
        <input
          name="username"
          defaultValue="qinwei"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={64}
          required
        />
      </label>

      <label className="auth-field">
        <span>密码</span>
        <span className="auth-password">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="输入密码"
            maxLength={128}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </span>
      </label>

      {state.error ? (
        <p className="auth-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button--primary auth-submit"
        disabled={pending}
      >
        {pending ? "正在开门…" : "推门进去"}
        {pending ? null : <ArrowRightIcon size={16} />}
      </button>
    </form>
  );
}
