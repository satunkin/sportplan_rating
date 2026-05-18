import Link from "next/link";

import { listEvents } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

function formatDisciplineLabel(value: Discipline) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

export default async function EventsPage() {
  const events = await listEvents();
  const upcoming = events.filter((event) => !event.isPast);
  const past = events.filter((event) => event.isPast);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Соревнования
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
            Карточки стартов сезона
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            Здесь собраны будущие и прошедшие соревнования. Для завершенных стартов можно открыть карточку с участниками сайта, временем, местами и начисленными очками.
          </p>
        </article>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Будущие
            </p>
            <div className="mt-5 grid gap-4">
              {upcoming.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-white/70 px-5 py-5 text-sm text-muted">
                  Пока нет запланированных стартов.
                </div>
              ) : (
                upcoming.map((event) => (
                  <Link key={event.id} className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:bg-white" href={`/events/${event.id}`}>
                    <p className="text-sm uppercase tracking-[0.16em] text-muted">
                      {formatDate(event.eventDate)} • {formatDisciplineLabel(event.discipline)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-accent-strong">{event.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {event.distanceLabel} • {event.location ?? "Место уточняется"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Прошедшие
            </p>
            <div className="mt-5 grid gap-4">
              {past.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border bg-white/70 px-5 py-5 text-sm text-muted">
                  Прошедших стартов пока нет.
                </div>
              ) : (
                past.map((event) => (
                  <Link key={event.id} className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:bg-white" href={`/events/${event.id}`}>
                    <p className="text-sm uppercase tracking-[0.16em] text-muted">
                      {formatDate(event.eventDate)} • {event.participantsCount} участников сайта
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-accent-strong">{event.name}</h2>
                    <p className="mt-2 text-sm text-muted">
                      {event.distanceLabel} • {event.location ?? "Место не указано"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
