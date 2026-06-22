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
      <p className="border border-dashed border-border px-5 py-8 text-sm text-muted">
        В этом разделе пока нет соревнований.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border border border-border bg-white">
      {items.map((competition) => (
        <article
          className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_220px]"
          key={competition.id}
        >
          <div>
            <p className="text-sm text-muted">
              {formatDate(competition.eventDate)} ·{" "}
              {competition.city ?? "Город уточняется"}
              {competition.series ? ` · ${competition.series.name}` : ""}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              <Link
                className="underline-offset-4 hover:underline"
                href={`/events/${competition.id}`}
              >
                {competition.name}
              </Link>
            </h2>
            <p className="mt-2 text-sm text-muted">
              {competition.distances
                .map(
                  (distance) =>
                    `${disciplineLabels[distance.discipline]} · ${distance.distanceLabel}`,
                )
                .join(", ")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm md:items-end">
            {upcoming ? (
              competition.registrationUrl || competition.pageUrl ? (
                <a
                  className="font-semibold text-accent underline-offset-4 hover:underline"
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
                <span className="text-muted">
                  {competition.participantsCount} участников рейтинга
                </span>
                <span className="text-muted">
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
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">
            Кубок Циклон · 2026
          </p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            Соревнования
          </h1>
        </header>

        <form className="flex flex-col gap-3 border border-border bg-white px-4 py-4 sm:flex-row">
          <select
            className="min-h-11 flex-1 border border-border px-3 text-sm"
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
            className="min-h-11 rounded-md bg-accent px-5 text-sm font-semibold text-white"
            type="submit"
          >
            Применить
          </button>
        </form>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-medium text-foreground">Будущие</h2>
            <span className="text-sm text-muted">{upcoming.length}</span>
          </div>
          <CompetitionList items={upcoming} upcoming />
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-medium text-foreground">Прошедшие</h2>
            <span className="text-sm text-muted">{past.length}</span>
          </div>
          <CompetitionList items={past} upcoming={false} />
        </section>
      </section>
    </main>
  );
}
