import Link from "next/link";

import { LeaderboardFilterForm } from "@/app/leaderboard/filter-form";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TechnicalNote } from "@/components/technical-note";
import { getLeaderboardFilterOptions, listLeaderboard } from "@/lib/db";
import { isCountedTowardTopThree } from "@/lib/ranking";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; ageGroup?: string; gender?: string }>;
}) {
  const { discipline, ageGroup, gender } = await searchParams;
  const entries = await listLeaderboard({ discipline, ageGroup, gender });
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
              Рейтинг сезона
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
              Таблица участников и очков
            </h1>
          </div>
          <div className="max-w-md text-sm leading-6 text-muted">
            Здесь видно текущее место, сумму очков и лучшие старты каждого
            участника.{" "}
            <Link
              className="font-semibold text-accent underline-offset-4 hover:underline"
              href="/rules"
            >
              Открыть правила
            </Link>
          </div>
        </div>

        <LeaderboardFilterForm
          ageGroups={filterOptions.ageGroups}
          disciplines={filterOptions.disciplines}
          genders={filterOptions.genders}
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
              спортсмена с уже подтвержденными результатами
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Подтверждено стартов
            </p>
            <p className="mt-2 text-3xl font-semibold text-accent-strong">
              {totalCountedResults}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              результатов уже участвуют в расчете рейтинга
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
              текущая сумма очков по всей таблице
            </p>
          </article>
        </div>

        <div className="mt-6">
          <TechnicalNote title="Техническая заметка о расчете">
            В карточках лучших стартов ниже сохранен детальный модуль
            `ScoreBreakdown`: он нужен разработке и модерации, чтобы видеть
            `basePoints`, `lagPercent` и попадание результата в топ-3 зачета.
          </TechnicalNote>
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
                        {entry.athlete.publicDisplayName?.trim() ||
                          `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim()}
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
                        {entry.scoredResultsCount} подтвержденных стартов
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="grid gap-2">
                        {entry.athlete.verifiedResults.map((result, index) => (
                          <div
                            key={result.id}
                            className="rounded-2xl border border-border bg-surface px-4 py-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-accent-strong">
                                  {result.submission.eventNameRaw}
                                </p>
                                <p className="mt-1 text-sm text-muted">
                                  {result.submission.distanceLabel}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  isCountedTowardTopThree(index)
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >
                                {isCountedTowardTopThree(index) ? "В зачете" : "Резерв"}
                              </span>
                            </div>
                            <ScoreBreakdown
                              ageGroupUsed={result.ageGroupUsed}
                              awardedPoints={result.awardedPoints}
                              basePoints={result.scoreRule.basePoints}
                              compact
                              fifthPlaceTimeSeconds={result.fifthPlaceTimeSeconds}
                              lagPercent={result.lagPercent.toString()}
                            />
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
