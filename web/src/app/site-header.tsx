"use client";

import {
  CalendarDots,
  CaretDown,
  ChartBar,
  List,
  Question,
  TelegramLogo,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigationLinks = [
  { href: "/leaderboard", label: "Рейтинг", icon: ChartBar },
  { href: "/events", label: "Соревнования", icon: CalendarDots },
  { href: "/rules", label: "Правила", icon: Question },
  { href: "/participate", label: "Как участвовать", icon: TelegramLogo },
];

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Основная навигация" className="grid gap-1">
      {navigationLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? "bg-accent text-white"
                : "text-foreground hover:bg-surface-strong"
            }`}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <Icon aria-hidden size={20} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="border-b border-border px-5 py-6">
          <Link className="block text-sm font-bold tracking-tight text-foreground" href="/">
            КУБОК ЦИКЛОН
          </Link>
          <p className="mt-1 text-xs font-medium text-muted">Рейтинг сезона 2026</p>
        </div>
        <div className="px-3 py-4">
          <Navigation />
        </div>
        <div className="mt-auto border-t border-border px-5 py-4 text-xs leading-5 text-muted">
          <p>Сезон 2026</p>
          <p>Обновлено 13 июля</p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 items-center justify-between px-4 sm:px-6">
          <Link className="text-sm font-bold tracking-tight" href="/">
            КУБОК ЦИКЛОН
          </Link>
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            className="grid size-11 place-items-center rounded-lg border border-border bg-white text-foreground"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            {mobileOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="border-t border-border px-4 py-3 shadow-lg sm:px-6">
            <Navigation onNavigate={() => setMobileOpen(false)} />
            <button
              className="mt-2 flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-xs font-medium text-muted"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              Свернуть меню <CaretDown size={16} />
            </button>
          </div>
        ) : null}
      </header>
    </>
  );
}
