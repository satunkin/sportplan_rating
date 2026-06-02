import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicEventCard } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatDisciplineLabel(value: Discipline) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getPublicEventCard(eventId);

  if (!event) {
    notFound();
  }

  const totalParticipants = event.distances.reduce(
    (sum, distance) => sum + distance.participants.length,
    0,
  );
  const distanceLabels = event.distances
    .map((distance) => distance.distanceLabel)
    .join(", ");

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Карточка соревнования
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
              {event.name}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted">
              {formatDate(event.eventDate)} · {formatDisciplineLabel(event.discipline)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            <p className="mt-3 text-base leading-7 text-muted">
              Дистанции: {distanceLabels}
            </p>
          </article>

          <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              {event.isPast ? "Прошедшее соревнование" : "Будущее соревнование"}
            </p>
            <p className="mt-4 text-5xl font-semibold">{event.distances.length}</p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              {event.isPast
                ? `Дистанций в карточке. Участников рейтинга: ${totalParticipants}.`
                : "Дистанций в карточке. Протокол и участники рейтинга появятся после старта."}
            </p>
            {event.isPast && event.sourceUrl ? (
              <a
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-slate-100"
                href={event.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                Открыть официальный протокол
              </a>
            ) : null}
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-4">
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Тип</p>
            <p className="mt-2 font-semibold text-accent-strong">
              {formatDisciplineLabel(event.discipline)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Дистанций
            </p>
            <p className="mt-2 font-semibold text-accent-strong">
              {event.distances.length}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Место</p>
            <p className="mt-2 font-semibold text-accent-strong">
              {event.location ?? "Не указано"}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">
              Протокол
            </p>
            <p className="mt-2 font-semibold text-accent-strong">
              {!event.isPast
                ? "После старта"
                : event.protocolRowsCount > 0
                  ? "Загружен"
                  : "Не загружен"}
            </p>
          </article>
        </section>

        {event.isPast ? (
          <section className="grid gap-6">
            {event.distances.map((distance) => (
              <article
                className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]"
                key={distance.id}
              >
                <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                      {distance.distanceLabel}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-accent-strong">
                      Участники рейтинга на дистанции
                    </h2>
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {distance.participants.length} подтвержденных участников
                  </p>
                </div>

                {distance.participants.length === 0 ? (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/70 px-6 py-8 text-sm text-muted">
                    Для этой дистанции еще нет подтвержденных участников рейтинга.
                  </div>
                ) : (
                  <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-border bg-white/80">
                    <table className="min-w-full border-collapse text-left">
                      <thead className="bg-surface-strong">
                        <tr className="text-sm uppercase tracking-[0.16em] text-muted">
                          <th className="px-5 py-4">Спортсмен</th>
                          <th className="px-5 py-4">Результат</th>
                          <th className="px-5 py-4">Позиция</th>
                          <th className="px-5 py-4">Очки</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distance.participants.map((participant) => (
                          <tr className="border-t border-border" key={participant.id}>
                            <td className="px-5 py-4">
                              <Link
                                className="font-semibold text-accent-strong underline-offset-4 hover:underline"
                                href={`/athletes/${participant.athleteId}`}
                              >
                                {participant.athleteDisplayName}
                              </Link>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted">
                              {participant.submission.finishTimeRaw}
                            </td>
                            <td className="px-5 py-4 text-sm text-muted">
                              {participant.submission.placementInAgeGroup
                                ? `${participant.submission.placementInAgeGroup} в группе`
                                : "—"}
                              {participant.submission.placementOverall
                                ? ` · ${participant.submission.placementOverall} абс.`
                                : ""}
                            </td>
                            <td className="px-5 py-4 text-lg font-semibold tabular-nums text-accent-strong">
                              {participant.awardedPoints}
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
        ) : (
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <h2 className="text-2xl font-semibold text-accent-strong">
              Дистанции соревнования
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {event.distances.map((distance) => (
                <div
                  className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 text-sm font-semibold text-accent-strong"
                  key={distance.id}
                >
                  {distance.distanceLabel}
                </div>
              ))}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
