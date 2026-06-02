import Link from "next/link";

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/88 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-5 py-3 sm:px-8 lg:px-10">
        <div className="flex items-center gap-5">
          <Link
            className="inline-flex items-center text-sm font-semibold tracking-[0.08em] text-foreground"
            href="/"
          >
            SportPlan rating
          </Link>
          <nav
            aria-label="Основная навигация"
            className="hidden items-center gap-1 md:flex"
          >
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong"
              href="/leaderboard"
            >
              Рейтинг
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong"
              href="/events"
            >
              Соревнования
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong"
              href="/rules"
            >
              Правила
            </Link>
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong"
              href="/participate"
            >
              Как участвовать
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
