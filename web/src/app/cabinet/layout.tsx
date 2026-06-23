import Link from "next/link";

import { logoutAdmin } from "@/app/cabinet/actions";
import { hasAdminSession } from "@/lib/session";

const adminNavigationLinks = [
  { href: "/cabinet", label: "Панель" },
  { href: "/cabinet/competitions", label: "Соревнования" },
  { href: "/cabinet/athletes", label: "Участники" },
  { href: "/cabinet/directories", label: "Клубы и тренеры" },
  { href: "/cabinet/submissions", label: "Проверка" },
  { href: "/cabinet/broadcasts", label: "Рассылки" },
];

export default async function CabinetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdmin = await hasAdminSession();

  return (
    <>
      {isAdmin ? (
        <div className="border-b border-border bg-surface/95">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-2 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <nav
              aria-label="Админская навигация"
              className="-mx-1 flex gap-1 overflow-x-auto"
            >
              {adminNavigationLinks.map((link) => (
                <Link
                  className="inline-flex min-h-10 shrink-0 items-center rounded-md px-3 text-sm font-semibold text-foreground transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <form action={logoutAdmin}>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:w-auto"
                type="submit"
              >
                Выйти из админ-режима
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
