import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:flex-1">
            <p className="text-sm font-semibold tracking-[0.08em] text-foreground">
              SportPlan rating
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              Открытый сезонный рейтинг спортсменов на основе подтвержденных
              результатов соревнований.
            </p>
          </div>
          <nav
            aria-label="Нижняя навигация"
            className="grid gap-3 text-sm text-muted sm:grid-cols-2"
          >
            <Link className="underline-offset-4 hover:underline" href="/leaderboard">
              Рейтинг
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/events">
              Соревнования
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/rules">
              Правила
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/participate">
              Как участвовать
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
            <Link className="text-muted/70 underline-offset-4 hover:underline" href="/admin/login">
              Администратору
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
