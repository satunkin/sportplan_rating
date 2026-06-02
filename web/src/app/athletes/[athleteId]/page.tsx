import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicAthleteProfile } from "@/lib/db";
import { isCountedTowardTopThree } from "@/lib/ranking";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AthletePublicPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const entry = await getPublicAthleteProfile(athleteId);

  if (!entry) {
    notFound();
  }

  const displayName =
    entry.athlete.publicDisplayName?.trim() ||
    `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim();
  const bestResults = entry.athlete.verifiedResults.slice(0, 3);

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-6 border-b border-border pb-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Карточка спортсмена
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              {displayName}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Публичная карточка участника рейтинга: текущее место, очки сезона
              и лучшие подтвержденные результаты.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border bg-white px-5 py-4">
              <p className="text-sm text-muted">Место</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
                {entry.rank ?? "—"}
              </p>
            </div>
            <div className="border border-border bg-white px-5 py-4">
              <p className="text-sm text-muted">Очки</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">
                {entry.totalPoints}
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">Возрастная категория</p>
            <p className="mt-2 font-semibold text-foreground">
              {entry.athlete.seasonAgeGroup ?? "—"}
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">Город</p>
            <p className="mt-2 font-semibold text-foreground">
              {entry.athlete.city ?? "—"}
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">В зачете</p>
            <p className="mt-2 font-semibold text-foreground">
              {entry.scoredResultsCount} подтвержденных стартов
            </p>
          </article>
        </section>

        <section className="border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Лучшие старты
            </p>
            <h2 className="mt-2 text-2xl font-medium text-foreground">
              Три результата, которые формируют рейтинг
            </h2>
          </div>
          {bestResults.length === 0 ? (
            <div className="px-5 py-10 text-sm text-muted">
              У спортсмена пока нет подтвержденных результатов.
            </div>
          ) : (
            <div className="grid gap-0 divide-y divide-border">
              {bestResults.map((result, index) => (
                <article
                  className="grid gap-3 px-5 py-5 md:grid-cols-[42px_minmax(0,1fr)_120px]"
                  key={result.id}
                >
                  <div className="text-2xl font-semibold tabular-nums text-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {result.submission.eventNameRaw}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {formatDate(result.submission.eventDate)} ·{" "}
                      {result.submission.distanceLabel} ·{" "}
                      {result.submission.finishTimeRaw}
                      {result.submission.placementInAgeGroup
                        ? ` · ${result.submission.placementInAgeGroup} в группе`
                        : ""}
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-3xl font-semibold tabular-nums text-foreground">
                      {result.awardedPoints}
                    </p>
                    <p className="text-sm text-muted">очков</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="border border-border bg-white">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-accent">
                История результатов
              </p>
              <h2 className="mt-2 text-2xl font-medium text-foreground">
                Все подтвержденные старты
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              href="/leaderboard"
            >
              Вернуться к рейтингу
            </Link>
          </div>

          {!entry.athlete.showPublicResults ? (
            <div className="px-5 py-10 text-sm leading-7 text-muted">
              Спортсмен оставил полную историю закрытой. В публичной карточке
              видны только место, очки и лучшие результаты.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-surface-strong">
                  <tr className="text-xs font-semibold uppercase text-muted">
                    <th className="px-4 py-3">Старт</th>
                    <th className="px-4 py-3">Результат</th>
                    <th className="px-4 py-3">Позиция</th>
                    <th className="px-4 py-3">Очки</th>
                    <th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.athlete.verifiedResults.map((result, index) => (
                    <tr className="border-t border-border" key={result.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-foreground">
                          {result.submission.eventNameRaw}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatDate(result.submission.eventDate)} ·{" "}
                          {result.submission.distanceLabel}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {result.submission.finishTimeRaw}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {result.submission.placementInAgeGroup
                          ? `${result.submission.placementInAgeGroup} в группе`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums text-foreground">
                        {result.awardedPoints}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {isCountedTowardTopThree(index) ? "зачет" : "резерв"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
