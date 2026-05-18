import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicEventCard } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

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
              {formatDate(event.eventDate)} • {formatDisciplineLabel(event.discipline)} •{" "}
              {event.distanceLabel}
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.18em] text-muted">Статус</p>
                <p className="mt-2 text-lg font-semibold text-accent-strong">
                  {event.isPast ? "Прошедшее" : "Будущее"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.18em] text-muted">Место</p>
                <p className="mt-2 text-lg font-semibold text-accent-strong">
                  {event.location ?? "Не указано"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.18em] text-muted">Категория</p>
                <p className="mt-2 text-lg font-semibold text-accent-strong">
                  {event.category?.label ?? "Категория будет подтверждена администратором"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
                <p className="text-sm uppercase tracking-[0.18em] text-muted">Протокол</p>
                <p className="mt-2 text-lg font-semibold text-accent-strong">
                  {event.sourceUrl ? "Доступен" : "Пока не добавлен"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Участники сайта
            </p>
            <p className="mt-4 text-5xl font-semibold">{event.participants.length}</p>
            <p className="mt-4 text-sm leading-7 text-white/82">
              В этой карточке показаны только зарегистрированные пользователи сайта, чьи результаты уже подтверждены в системе.
            </p>
            {event.sourceUrl ? (
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

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Результаты спортсменов сайта
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-accent-strong">
                Время, места и баллы рейтинга
              </h2>
            </div>
            <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href="/events">
              Все соревнования
            </Link>
          </div>

          {event.participants.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/70 px-6 py-8 text-sm text-muted">
              Для этого соревнования еще нет подтвержденных участников сайта.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-white/80">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-surface-strong">
                  <tr className="text-sm uppercase tracking-[0.16em] text-muted">
                    <th className="px-5 py-4">Спортсмен</th>
                    <th className="px-5 py-4">Время</th>
                    <th className="px-5 py-4">Место</th>
                    <th className="px-5 py-4">Очки</th>
                  </tr>
                </thead>
                <tbody>
                  {event.participants.map((participant) => (
                    <tr key={participant.id} className="border-t border-border">
                      <td className="px-5 py-4">
                        <Link className="font-semibold text-accent-strong underline-offset-4 hover:underline" href={`/athletes/${participant.athleteId}`}>
                          {participant.athleteDisplayName}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted">
                        {participant.submission.finishTimeRaw}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted">
                        {participant.submission.placementOverall
                          ? `${participant.submission.placementOverall} абс.`
                          : "—"}
                        {participant.submission.placementInAgeGroup
                          ? ` / ${participant.submission.placementInAgeGroup} в группе`
                          : ""}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-lg font-semibold text-accent-strong">
                          {participant.awardedPoints}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
