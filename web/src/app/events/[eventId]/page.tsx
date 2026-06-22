import { notFound } from "next/navigation";

import { getPublicCompetition } from "@/lib/cyclon-service";
import { formatDate, formatDurationFromSeconds } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const competition = await getPublicCompetition(eventId);

  if (!competition) notFound();

  const externalUrl = competition.isPast
    ? competition.resultsUrl ??
      competition.distances.find((distance) => distance.sourceUrl)?.sourceUrl
    : competition.registrationUrl ?? competition.pageUrl;

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-accent">
              {competition.isPast ? "Прошедшее соревнование" : "Будущий старт"}
            </p>
            <h1 className="mt-2 text-4xl font-medium text-foreground">
              {competition.name}
            </h1>
            <p className="mt-3 text-base text-muted">
              {formatDate(competition.eventDate)} ·{" "}
              {competition.city ?? "Город уточняется"}
              {competition.series ? ` · ${competition.series.name}` : ""}
            </p>
          </div>
          {externalUrl ? (
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 text-sm font-semibold text-white"
              href={externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              {competition.isPast
                ? "Открыть официальный протокол"
                : "Регистрация"}
            </a>
          ) : null}
        </header>

        <section className="grid gap-5">
          {competition.distances.map((distance) => (
            <article className="border border-border bg-white" key={distance.id}>
              <div className="border-b border-border px-5 py-4">
                <p className="text-sm text-muted">{distance.discipline}</p>
                <h2 className="mt-1 text-2xl font-medium text-foreground">
                  {distance.distanceLabel}
                </h2>
                {distance.protocolGroups.length ? (
                  <details className="mt-3 text-sm text-muted">
                    <summary className="cursor-pointer font-semibold text-accent">
                      Группы и benchmark пятого места ·{" "}
                      {distance.protocolGroups.length}
                    </summary>
                    <div className="mt-3 max-h-72 overflow-auto border border-border bg-white">
                      {distance.protocolGroups.map((group) => (
                        <div
                          className="grid grid-cols-[minmax(0,1fr)_110px] gap-3 border-b border-border px-3 py-2 last:border-b-0"
                          key={group.id}
                        >
                          <span>{group.label}</span>
                          <span className="text-right tabular-nums text-foreground">
                            {group.fifthPlaceTimeSeconds
                              ? formatDurationFromSeconds(
                                  group.fifthPlaceTimeSeconds,
                                )
                              : "меньше 5"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>

              {!competition.isPast ? (
                <p className="px-5 py-6 text-sm text-muted">
                  Участники рейтинга и результаты появятся после старта.
                </p>
              ) : distance.participants.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted">
                  На этой дистанции пока нет подтверждённых участников рейтинга.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-surface-strong text-xs text-muted">
                      <tr>
                        <th className="px-4 py-3">Атлет</th>
                        <th className="px-4 py-3">Группа</th>
                        <th className="px-4 py-3">Время</th>
                        <th className="px-4 py-3">Место</th>
                        <th className="px-4 py-3">Очки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distance.participants.map((participant) => (
                        <tr className="border-t border-border" key={participant.id}>
                          <td className="px-4 py-4 font-semibold text-foreground">
                            {participant.athleteName}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted">
                            {participant.ageGroup}
                          </td>
                          <td className="px-4 py-4 text-sm tabular-nums text-muted">
                            {participant.finishTime}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted">
                            {participant.placementInAgeGroup
                              ? `${participant.placementInAgeGroup} в группе`
                              : participant.placementOverall ?? "—"}
                          </td>
                          <td className="px-4 py-4 font-semibold tabular-nums text-foreground">
                            {participant.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
