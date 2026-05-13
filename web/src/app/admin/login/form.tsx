"use client";

import { useActionState } from "react";

import { loginAdmin, type AdminLoginState } from "@/app/admin/login/actions";
import type { AdminAuthMode } from "@/lib/admin-auth";

const initialState: AdminLoginState = {
  errors: [],
};

export function AdminLoginForm({ mode }: { mode: AdminAuthMode }) {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      {mode === "credentials" ? (
        <>
          <label className="text-sm font-medium text-foreground">
            Email администратора
            <input
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
              autoComplete="username"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="text-sm font-medium text-foreground">
            Пароль
            <input
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
        </>
      ) : (
        <label className="text-sm font-medium text-foreground">
          Ключ доступа
          <input
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
            name="passphrase"
            required
            type="password"
          />
        </label>
      )}

      {state.errors.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <ul className="grid gap-2">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Проверяем..." : "Войти в админку"}
      </button>
    </form>
  );
}
