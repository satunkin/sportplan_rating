import Link from "next/link";

import { LeaderboardBoard } from "@/components/leaderboard-board";
import { listPublicLeaderboardRows } from "@/lib/cyclon-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await listPublicLeaderboardRows();
  const maleRows = rows.filter((row) => row.gender === "MALE").slice(0, 10);
  const femaleRows = rows.filter((row) => row.gender === "FEMALE").slice(0, 10);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Сезон 2026
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
            Рейтинг Кубка Циклон
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Мужской и женский зачёты считаются отдельно. В итог сезона входят
            три лучших подтверждённых результата каждого атлета.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
              href="/leaderboard"
            >
              Открыть полный рейтинг
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 py-3 text-base font-semibold text-foreground transition hover:bg-surface-strong"
              href="/rules"
            >
              Посмотреть правила
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Формула
            </p>
            <h2 className="mt-3 text-xl font-semibold text-accent-strong">
              Сравнение с пятым местом
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Результат сравнивается со временем пятого места в группе.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Разделение
            </p>
            <h2 className="mt-3 text-xl font-semibold text-accent-strong">
              Два независимых зачёта
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Мужской и женский рейтинги рассчитываются отдельно.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Итог сезона
            </p>
            <h2 className="mt-3 text-xl font-semibold text-accent-strong">
              Три лучших старта
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Итог сезона: сумма трёх лучших подтверждённых результатов.
            </p>
          </article>
        </section>

        <LeaderboardBoard maleRows={maleRows} femaleRows={femaleRows} />

        <div className="flex justify-center pt-2">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
            href="/leaderboard"
          >
            Показать полный рейтинг
          </Link>
        </div>
      </section>
    </main>
  );
}
