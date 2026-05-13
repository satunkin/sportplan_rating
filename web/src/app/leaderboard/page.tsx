import Link from "next/link";

import { LeaderboardFilterForm } from "@/app/leaderboard/filter-form";
import { getLeaderboardFilterOptions, listLeaderboard } from "@/lib/db";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; ageGroup?: string }>;
}) {
  const { discipline, ageGroup } = await searchParams;
  const entries = await listLeaderboard({ discipline, ageGroup });
  const filterOptions = await getLeaderboardFilterOptions();
  const totalAthletes = entries.length;
  const totalPoints = entries.reduce((sum, entry) => sum + entry.totalPoints, 0);
  const totalCountedResults = entries.reduce(
    (sum, entry) => sum + entry.scoredResultsCount,
    0,
  );

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Public leaderboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
              Сезонный рейтинг Cyclon
            </h1>
          </div>
          <p className="text-sm leading-6 text-muted">
            Сейчас рейтинг считается по подтвержденным результатам и сумме трех
            лучших стартов спортсмена.
          </p>
        </div>

        <LeaderboardFilterForm
          ageGroups={filterOptions.ageGroups}
          disciplines={filterOptions.disciplines}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              В рейтинге
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent-strong">
              {totalAthletes}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              спортсмена с подтвержденными стартами
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Учтено стартов
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent-strong">
              {totalCountedResults}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              попали в сумму лучших результатов
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Сумма очков
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent-strong">
              {totalPoints}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              общий объем рейтинговых очков в таблице
            </p>
          </article>
        </div>

        {entries.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
            Таблица пока пуста. После подтверждения первого результата в
            админской очереди здесь появится рейтинг сезона.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-white/80">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-strong">
                <tr className="text-sm uppercase tracking-[0.16em] text-muted">
                  <th className="px-5 py-4">Место</th>
                  <th className="px-5 py-4">Спортсмен</th>
                  <th className="px-5 py-4">Город</th>
                  <th className="px-5 py-4">Очки</th>
                  <th className="px-5 py-4">Лучшие старты</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border align-top">
                    <td className="px-5 py-4 text-lg font-semibold text-accent-strong">
                      {entry.rank}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="text-base font-semibold text-accent-strong underline-offset-4 hover:underline"
                        href={`/athletes/${entry.athlete.id}`}
                      >
                        {entry.athlete.firstName} {entry.athlete.lastName}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {entry.athlete.seasonAgeGroup ?? "Группа не указана"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      {entry.athlete.city ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-lg font-semibold text-accent-strong">
                        {entry.totalPoints}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {entry.scoredResultsCount} из 3 результатов
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid gap-2">
                        {entry.athlete.verifiedResults.map((result) => (
                          <div
                            key={result.id}
                            className="rounded-2xl border border-border bg-surface px-4 py-3"
                          >
                            <p className="text-sm font-medium text-accent-strong">
                              {result.submission.eventNameRaw}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {result.submission.distanceLabel} • {result.awardedPoints} pts
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link
            className="inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
            href="/"
          >
            Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  );
}
