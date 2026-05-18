import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[rgba(255,250,242,0.85)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              SportPlan rating
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Рейтинг для атлетов-любителей: подайте результаты, следите за
              местом в сезоне и в любой момент проверьте, как начисляются очки.
            </p>
          </div>
          <nav
            aria-label="Нижняя навигация"
            className="grid gap-3 text-sm text-accent-strong sm:grid-cols-2"
          >
            <Link className="underline-offset-4 hover:underline" href="/leaderboard">
              Рейтинг
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/rules">
              Полные правила
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/cabinet">
              Личный кабинет
            </Link>
            <Link
              className="underline-offset-4 hover:underline"
              href="/legal/user-agreement"
            >
              Пользовательское соглашение
            </Link>
            <Link
              className="underline-offset-4 hover:underline"
              href="/legal/personal-data"
            >
              Соглашение о персональных данных
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
