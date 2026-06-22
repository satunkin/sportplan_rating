import Link from "next/link";

import { listPublicCompetitions } from "@/lib/cyclon-service";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

export const dynamic = "force-dynamic";

const disciplineLabels: Record<Discipline, string> = {
  RUNNING: "Бег",
  CYCLING: "Велоспорт",
  SWIMMING: "Плавание",
  TRIATHLON: "Триатлон",
};

type CompetitionItem = Awaited<
  ReturnType<typeof listPublicCompetitions>
>[number];

function CompetitionList({
  items,
  upcoming,
}: {
  items: CompetitionItem[];
  upcoming: boolean;
}) {
  if (!items.length) {
    return (
      <p className="rounded-[1.5rem] border border-dashed border-border bg-surface px-5 py-8 text-sm text-muted">
        В этом разделе пока нет соревнований.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-white/78">
      {items.map((competition) => (
        <article
          className="grid gap-4 px-6 py-6 transition hover:bg-surface md:grid-cols-[minmax(0,1fr)_220px]"
          key={competition.id}
        >
          <div>
            <p className="text-sm leading-6 text-muted">
              {formatDate(competition.eventDate)} ·{" "}
              {competition.city ?? "Город уточняется"}
              {competition.series ? ` · ${competition.series.name}` : ""}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-accent-strong">
              <Link
                className="underline-offset-4 hover:underline"
                href={`/events/${competition.id}`}
              >
                {competition.name}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              {competition.distances
                .map(
                  (distance) =>
                    `${disciplineLabels[distance.discipline]} · ${distance.distanceLabel}`,
                )
                .join(", ")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm md:items-end md:justify-center">
            {upcoming ? (
              competition.registrationUrl || competition.pageUrl ? (
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 font-semibold text-white transition hover:bg-accent-strong"
                  href={competition.registrationUrl ?? competition.pageUrl ?? "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  Регистрация
                </a>
              ) : (
                <span className="text-muted">Ссылка появится позже</span>
              )
            ) : (
              <>
                <span className="rounded-full bg-surface-strong px-3 py-1.5 text-muted">
                  {competition.participantsCount} участников рейтинга
                </span>
                <span className="rounded-full bg-surface-strong px-3 py-1.5 text-muted">
                  {competition.protocolRowsCount} строк протокола
                </span>
              </>
            )}
          </div>
        </article>
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
  const competitions = await listPublicCompetitions({ discipline });
  const upcoming = competitions.filter((item) => !item.isPast);
  const past = competitions.filter((item) => item.isPast);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Кубок Циклон · 2026
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
            Соревнования
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Календарь стартов сезона, ссылки на регистрацию и результаты
            атлетов, которые участвуют в рейтинге.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
              href="/leaderboard"
            >
              Открыть рейтинг
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 py-3 text-base font-semibold text-foreground transition hover:bg-surface-strong"
              href="/rules"
            >
              Посмотреть правила
            </Link>
          </div>
        </header>

        <form className="flex flex-col gap-3 rounded-[1.75rem] border border-border bg-surface px-5 py-5 sm:flex-row">
          <select
            className="min-h-11 flex-1 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            defaultValue={discipline ?? "all"}
            name="discipline"
          >
            <option value="all">Все дисциплины</option>
            {Object.values(Discipline).map((item) => (
              <option key={item} value={item}>
                {disciplineLabels[item]}
              </option>
            ))}
          </select>
          <button
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong"
            type="submit"
          >
            Применить
          </button>
        </form>

        <section>
          <div className="mb-4 flex items-end justify-between px-1">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Календарь
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
                Будущие старты
              </h2>
            </div>
            <span className="rounded-full bg-surface-strong px-3 py-1.5 text-sm text-muted">
              {upcoming.length}
            </span>
          </div>
          <CompetitionList items={upcoming} upcoming />
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between px-1">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Архив сезона
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
                Прошедшие старты
              </h2>
            </div>
            <span className="rounded-full bg-surface-strong px-3 py-1.5 text-sm text-muted">
              {past.length}
            </span>
          </div>
          <CompetitionList items={past} upcoming={false} />
        </section>
      </section>
    </main>
  );
}
