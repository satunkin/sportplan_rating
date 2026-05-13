import Link from "next/link";

import { getAthleteUserSession } from "@/lib/session";

export async function SiteHeader() {
  const athleteUserId = await getAthleteUserSession();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[rgba(247,242,233,0.9)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-12">
        <Link
          className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold tracking-[0.08em] text-accent"
          href="/"
        >
          SportPlan rating
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/rules"
          >
            Правила
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/leaderboard"
          >
            Рейтинг
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href={athleteUserId ? "/cabinet" : "/login"}
          >
            {athleteUserId ? "Кабинет" : "Войти"}
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
            href="/register"
          >
            Регистрация
          </Link>
        </nav>
      </div>
    </header>
  );
}
