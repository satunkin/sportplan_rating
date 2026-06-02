import Link from "next/link";

import { listPublicEventCards } from "@/lib/db";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatDisciplineLabel(value: Discipline | string) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

type EventItem = Awaited<ReturnType<typeof listPublicEventCards>>[number];

function EventList({
  events,
  showProtocolMeta,
}: {
  events: EventItem[];
  showProtocolMeta: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border bg-white/70 px-5 py-8 text-sm text-muted">
        В этом разделе пока нет соревнований.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Link
          className="grid gap-4 rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:bg-white md:grid-cols-[minmax(0,1fr)_240px]"
          href={`/events/${event.id}`}
          key={event.id}
        >
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.16em] text-muted">
              {formatDate(event.eventDate)} · {formatDisciplineLabel(event.discipline)}
            </p>
            <h2 className="mt-2 truncate text-xl font-semibold text-accent-strong">
              {event.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {event.distances.join(", ")} · {event.location ?? "Место уточняется"}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-muted md:text-right">
            <span>{event.distances.length} дистанц.</span>
            {showProtocolMeta ? (
              <>
                <span>{event.participantsCount} участников рейтинга</span>
                <span>
                  {event.protocolRowsCount > 0
                    ? `протокол загружен: ${event.protocolRowsCount} строк`
                    : event.hasProtocolUrl
                      ? "ссылка на протокол добавлена"
                      : "протокол не добавлен"}
                </span>
              </>
            ) : (
              <span>протокол и участники появятся после старта</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>;
}) {
  const { discipline } = await searchParams;
  const events = await listPublicEventCards({ discipline });
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
            Старты сезона и протоколы
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            Здесь собраны будущие и прошедшие соревнования. У одного
            соревнования может быть несколько дистанций; участники рейтинга и
            протоколы показываются только для прошедших стартов.
          </p>

          <form className="mt-6 grid gap-3 rounded-[1.5rem] border border-border bg-white/70 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="text-sm font-medium text-foreground">
              Тип соревнования
              <select
                className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
                defaultValue={discipline ?? "all"}
                name="discipline"
              >
                <option value="all">Все типы</option>
                {Object.values(Discipline).map((item) => (
                  <option key={item} value={item}>
                    {formatDisciplineLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
              type="submit"
            >
              Применить
            </button>
          </form>
        </article>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <div className="flex items-end justify-between border-b border-border pb-5">
              <h2 className="text-2xl font-semibold text-accent-strong">Будущие</h2>
              <span className="text-sm text-muted">{upcoming.length}</span>
            </div>
            <div className="mt-5">
              <EventList events={upcoming} showProtocolMeta={false} />
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <div className="flex items-end justify-between border-b border-border pb-5">
              <h2 className="text-2xl font-semibold text-accent-strong">
                Прошедшие
              </h2>
              <span className="text-sm text-muted">{past.length}</span>
            </div>
            <div className="mt-5">
              <EventList events={past} showProtocolMeta />
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
