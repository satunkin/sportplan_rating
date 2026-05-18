import Link from "next/link";

import { getAthleteUserSession, hasAdminSession } from "@/lib/session";

export async function SiteHeader() {
  const [athleteUserId, adminSession] = await Promise.all([
    getAthleteUserSession(),
    hasAdminSession(),
  ]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[rgba(247,242,233,0.9)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold tracking-[0.08em] text-accent"
            href="/"
          >
            SportPlan rating
          </Link>
          <p className="text-sm leading-6 text-muted">
            Сезонный рейтинг для атлетов
          </p>
        </div>

        <nav aria-label="Основная навигация" className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/leaderboard"
          >
            Рейтинг
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/events"
          >
            Соревнования
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/rules"
          >
            Правила рейтинга
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href={adminSession || athleteUserId ? "/cabinet" : "/login"}
          >
            {adminSession
              ? "Админ-кабинет"
              : athleteUserId
                ? "Личный кабинет"
                : "Войти"}
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
            href="/register"
          >
            Стать участником
          </Link>
        </nav>
      </div>
    </header>
  );
}
