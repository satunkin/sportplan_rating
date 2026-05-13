"use client";

import { useActionState } from "react";

import {
  loginAthlete,
  requestAthleteMagicLink,
  type AthleteLoginState,
} from "@/app/login/actions";

const initialState: AthleteLoginState = {
  errors: [],
  info: null,
  previewUrl: null,
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent";

export function AthleteLoginForm() {
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(
    requestAthleteMagicLink,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    loginAthlete,
    initialState,
  );

  return (
    <div className="grid gap-6">
      <form action={magicLinkAction} className="grid gap-5 rounded-[1.5rem] border border-border bg-white/65 px-5 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Основной вход
          </p>
          <h3 className="mt-2 text-xl font-semibold text-accent-strong">
            Войти по ссылке из email
          </h3>
        </div>

        <label className="text-sm font-medium text-foreground">
          Email
          <input
            autoComplete="username"
            className={inputClassName}
            name="email"
            required
            type="email"
          />
        </label>

        {magicLinkState.errors.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <ul className="grid gap-2">
              {magicLinkState.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {magicLinkState.info ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p>{magicLinkState.info}</p>
            {magicLinkState.previewUrl ? (
              <p className="mt-3">
                Dev preview:{" "}
                <a
                  className="font-medium underline underline-offset-4"
                  href={magicLinkState.previewUrl}
                >
                  открыть magic link
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
          disabled={magicLinkPending}
          type="submit"
        >
          {magicLinkPending ? "Готовим ссылку..." : "Получить ссылку для входа"}
        </button>
      </form>

      <form action={passwordAction} className="grid gap-5 rounded-[1.5rem] border border-border bg-surface px-5 py-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            Временный fallback
          </p>
          <h3 className="mt-2 text-xl font-semibold text-accent-strong">
            Войти по паролю
          </h3>
        </div>

        <label className="text-sm font-medium text-foreground">
          Email
          <input
            autoComplete="username"
            className={inputClassName}
            name="email"
            required
            type="email"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Пароль
          <input
            autoComplete="current-password"
            className={inputClassName}
            name="password"
            required
            type="password"
          />
        </label>

        {passwordState.errors.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <ul className="grid gap-2">
              {passwordState.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={passwordPending}
          type="submit"
        >
          {passwordPending ? "Проверяем..." : "Войти по паролю"}
        </button>
      </form>
    </div>
  );
}
