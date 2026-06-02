import Link from "next/link";

import { listLeaderboard } from "@/lib/db";

export const dynamic = "force-dynamic";

type LeaderboardEntry = Awaited<ReturnType<typeof listLeaderboard>>[number];

function athleteName(entry: LeaderboardEntry) {
  return (
    entry.athlete.publicDisplayName?.trim() ||
    `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim()
  );
}

function LeaderboardPreview({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-surface px-5 py-5 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted">Топ-10</span>
      </div>

      {entries.length === 0 ? (
        <div className="px-4 py-10 text-sm leading-6 text-muted">
          Рейтинг пока пуст. Первые позиции появятся после подтверждения
          результатов администратором.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {entries.map((entry) => (
            <Link
              className="grid gap-3 px-4 py-4 transition hover:bg-surface-strong lg:grid-cols-[42px_minmax(0,1fr)_96px]"
              href={`/athletes/${entry.athlete.id}`}
              key={entry.id}
            >
              <div className="text-2xl font-semibold tabular-nums text-foreground">
                {entry.rank}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="truncate text-base font-semibold text-foreground">
                    {athleteName(entry)}
                  </p>
                  <p className="text-sm text-muted">
                    {entry.athlete.seasonAgeGroup ?? "Группа уточняется"}
                  </p>
                </div>
                <div className="mt-3 grid gap-1.5">
                  {entry.athlete.verifiedResults.slice(0, 3).map((result) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_70px_56px] gap-2 text-sm"
                      key={result.id}
                    >
                      <span className="truncate text-muted">
                        {result.submission.eventNameRaw}
                      </span>
                      <span className="text-right text-foreground">
                        {result.submission.finishTimeRaw}
                      </span>
                      <span className="text-right font-semibold text-foreground">
                        {result.awardedPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {entry.totalPoints}
                </p>
                <p className="text-xs text-muted">очков</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Home() {
  const [maleEntries, femaleEntries] = await Promise.all([
    listLeaderboard({ gender: "male" }),
    listLeaderboard({ gender: "female" }),
  ]);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Рейтинг сезона 2026
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-medium tracking-normal text-foreground sm:text-5xl">
              Рейтинг спортсменов по итогам соревнований сезона
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted lg:justify-self-end">
            Мужской и женский зачет считаются отдельно. В рейтинг попадают
            подтвержденные результаты, а итог сезона считается по сумме трех
            лучших стартов.
          </p>
        </div>

        <section className="grid gap-5 xl:grid-cols-2">
          <LeaderboardPreview entries={maleEntries.slice(0, 10)} title="Мужчины" />
          <LeaderboardPreview entries={femaleEntries.slice(0, 10)} title="Женщины" />
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
            href="/leaderboard"
          >
            Полный рейтинг
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
            href="/events"
          >
            Соревнования
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white"
            href="/participate"
          >
            Как участвовать
          </Link>
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm font-semibold text-foreground">
              3 лучших результата
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Стартов может быть больше, но сезонная сумма берется только из
              трех сильнейших подтвержденных результатов.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm font-semibold text-foreground">
              Проверка администратором
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Результаты из Telegram-бота попадают в очередь проверки и
              публикуются после подтверждения.
            </p>
          </article>
          <article className="rounded-[1.75rem] border border-border bg-surface px-6 py-6">
            <p className="text-sm font-semibold text-foreground">
              Прозрачные протоколы
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Для соревнований хранятся карточки, ссылки на протоколы и
              участники рейтинга с временем, местами и очками.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
