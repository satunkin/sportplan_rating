import Link from "next/link";

const navigationLinks = [
  { href: "/leaderboard", label: "Рейтинг" },
  { href: "/events", label: "Соревнования" },
  { href: "/rules", label: "Правила" },
  { href: "/participate", label: "Как участвовать" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-3 sm:px-8 md:flex-row md:items-center md:gap-5 lg:px-10">
        <div className="flex items-center justify-between gap-5">
          <Link
            className="inline-flex min-h-10 items-center text-sm font-semibold text-foreground"
            href="/"
          >
            Кубок Циклон · 2026
          </Link>
          <nav
            aria-label="Основная навигация"
            className="hidden items-center gap-1 md:flex"
          >
            {navigationLinks.map((link) => (
              <Link
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <nav
          aria-label="Мобильная навигация"
          className="-mx-1 grid grid-cols-4 md:hidden"
        >
          {navigationLinks.map((link) => (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md px-1 text-center text-xs font-medium text-foreground transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
