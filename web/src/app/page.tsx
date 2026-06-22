import Link from "next/link";

import { LeaderboardBoard } from "@/components/leaderboard-board";
import { listPublicLeaderboardRows } from "@/lib/cyclon-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await listPublicLeaderboardRows();
  const maleRows = rows.filter((row) => row.gender === "MALE").slice(0, 10);
  const femaleRows = rows.filter((row) => row.gender === "FEMALE").slice(0, 10);

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">Сезон 2026</p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            Рейтинг Кубка Циклон
          </h1>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <article className="border border-border bg-white px-5 py-4">
            <h2 className="font-semibold text-foreground">Как считаются очки</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Результат сравнивается со временем пятого места в группе.
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <h2 className="font-semibold text-foreground">Два зачёта</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Мужской и женский рейтинги рассчитываются отдельно.
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <h2 className="font-semibold text-foreground">Три лучших старта</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Итог сезона — сумма трёх лучших подтверждённых результатов.
            </p>
          </article>
        </section>

        <LeaderboardBoard maleRows={maleRows} femaleRows={femaleRows} />

        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
          href="/leaderboard"
        >
          Открыть полный рейтинг
        </Link>
      </section>
    </main>
  );
}
