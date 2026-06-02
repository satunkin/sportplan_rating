import Link from "next/link";

import { LeaderboardFilterForm } from "@/app/leaderboard/filter-form";
import { getLeaderboardFilterOptions, listLeaderboard } from "@/lib/db";
import { isCountedTowardTopThree } from "@/lib/ranking";

export const dynamic = "force-dynamic";

function buildGenderHref(
  current: { discipline?: string; ageGroup?: string },
  gender: string,
) {
  const params = new URLSearchParams();

  if (current.discipline) params.set("discipline", current.discipline);
  if (current.ageGroup) params.set("ageGroup", current.ageGroup);
  params.set("gender", gender);

  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; ageGroup?: string; gender?: string }>;
}) {
  const { discipline, ageGroup, gender } = await searchParams;
  const activeGender = gender === "female" ? "female" : "male";
  const entries = await listLeaderboard({ discipline, ageGroup, gender: activeGender });
  const filterOptions = await getLeaderboardFilterOptions();
  const totalCountedResults = entries.reduce(
    (sum, entry) => sum + entry.scoredResultsCount,
    0,
  );

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Рейтинг сезона
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              Полная таблица участников
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Место, сумма очков и лучшие старты каждого спортсмена. В зачет
              идут три лучших подтвержденных результата сезона.
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-full border border-border bg-white/80 text-sm font-semibold">
            {[
              ["male", "Мужчины", "male"],
              ["female", "Женщины", "female"],
            ].map(([value, label, hrefGender]) => (
              <Link
                className={`px-5 py-3 text-center transition ${
                  activeGender === value
                    ? "bg-accent text-white"
                    : "text-accent-strong hover:bg-surface-strong"
                }`}
                href={buildGenderHref({ discipline, ageGroup }, hrefGender)}
                key={value}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <LeaderboardFilterForm
          ageGroups={filterOptions.ageGroups}
          disciplines={filterOptions.disciplines}
        />

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm text-muted">В таблице</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {entries.length}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm text-muted">Зачетных стартов</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {totalCountedResults}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm text-muted">Формула</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              сумма 3 лучших результатов
            </p>
          </article>
        </section>

        {entries.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-10 text-sm leading-7 text-muted">
            Таблица пока пуста или фильтры не нашли участников.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[1.5rem] border border-border bg-white/80">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-surface-strong">
                <tr className="text-xs font-semibold uppercase text-muted">
                  <th className="px-4 py-3">Место</th>
                  <th className="px-4 py-3">Спортсмен</th>
                  <th className="px-4 py-3">Очки</th>
                  <th className="px-4 py-3">Три лучших результата</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr className="border-t border-border align-top" key={entry.id}>
                    <td className="px-4 py-4 text-2xl font-semibold tabular-nums text-foreground">
                      {entry.rank}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-foreground underline-offset-4 hover:underline"
                        href={`/athletes/${entry.athlete.id}`}
                      >
                        {entry.athlete.publicDisplayName?.trim() ||
                          `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim()}
                      </Link>
                      <p className="mt-1 text-sm text-muted">
                        {entry.athlete.seasonAgeGroup ?? "Группа уточняется"}
                        {entry.athlete.city ? ` · ${entry.athlete.city}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-2xl font-semibold tabular-nums text-foreground">
                        {entry.totalPoints}
                      </p>
                      <p className="text-sm text-muted">
                        {entry.scoredResultsCount} подтвержденных стартов
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        {entry.athlete.verifiedResults.map((result, index) => (
                          <div
                            className="grid gap-2 border border-border px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_88px_70px_74px]"
                            key={result.id}
                          >
                            <span className="min-w-0 truncate font-medium text-foreground">
                              {result.submission.eventNameRaw}
                            </span>
                            <span className="text-muted">
                              {result.submission.finishTimeRaw}
                            </span>
                            <span className="font-semibold text-foreground">
                              {result.awardedPoints}
                            </span>
                            <span className="text-muted">
                              {isCountedTowardTopThree(index) ? "зачет" : "резерв"}
                            </span>
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
      </section>
    </main>
  );
}
