import { notFound, redirect } from "next/navigation";

import {
  addCompetitionDistance,
  saveCompetition,
  saveGroupBenchmark,
} from "@/app/admin/management-actions";
import { getAdminCompetition } from "@/lib/cyclon-service";
import { hasAdminSession } from "@/lib/session";
import { Discipline } from "@prisma/client";

function formatSeconds(value: number | null) {
  if (value === null) return "";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default async function AdminCompetitionEditPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const { eventId } = await params;
  const competition = await getAdminCompetition(eventId);
  if (!competition) notFound();

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">
            Админ · соревнование
          </p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            {competition.name}
          </h1>
        </header>

        <form action={saveCompetition} className="grid gap-3 border border-border bg-white px-5 py-5 md:grid-cols-2">
          <input name="competitionId" type="hidden" value={competition.id} />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.name} name="name" required />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.eventDate.toISOString().slice(0, 10)} name="eventDate" required type="date" />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.city ?? ""} name="city" placeholder="Город" />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.series?.name ?? ""} name="seriesName" placeholder="Серия" />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.pageUrl ?? ""} name="pageUrl" placeholder="Официальная страница" type="url" />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.registrationUrl ?? ""} name="registrationUrl" placeholder="Регистрация" type="url" />
          <input className="min-h-11 border border-border px-3" defaultValue={competition.resultsUrl ?? ""} name="resultsUrl" placeholder="Результаты" type="url" />
          <button className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white" type="submit">
            Сохранить соревнование
          </button>
        </form>

        <section className="grid gap-4">
          {competition.distances.map((distance) => (
            <article className="border border-border bg-white" key={distance.id}>
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-2xl font-medium text-foreground">
                  {distance.distanceLabel}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {distance.discipline} · {distance._count.protocolRows} строк ·{" "}
                  {distance._count.verifiedResults} результатов
                </p>
              </div>
              <div className="grid gap-3 px-5 py-5">
                {distance.protocolGroups.map((group) => (
                  <form
                    action={saveGroupBenchmark}
                    className="grid gap-3 border border-border px-4 py-4 md:grid-cols-[1fr_180px_1fr_auto]"
                    key={group.id}
                  >
                    <input name="competitionId" type="hidden" value={competition.id} />
                    <input name="groupId" type="hidden" value={group.id} />
                    <div>
                      <p className="font-semibold text-foreground">{group.label}</p>
                      <p className="text-xs text-muted">
                        Источник: {group.benchmarkSource ?? "не определён"}
                      </p>
                    </div>
                    <input
                      className="min-h-10 border border-border px-3"
                      defaultValue={formatSeconds(group.fifthPlaceTimeSeconds)}
                      name="fifthPlaceTime"
                      placeholder="Время 5-го места"
                      required
                    />
                    <input
                      className="min-h-10 border border-border px-3"
                      defaultValue={group.benchmarkNotes ?? ""}
                      name="notes"
                      placeholder="Основание ручной правки"
                    />
                    <button className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold" type="submit">
                      Сохранить
                    </button>
                  </form>
                ))}
                {!distance.protocolGroups.length ? (
                  <p className="text-sm text-muted">
                    Группы появятся после импорта протокола.
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <article className="border border-border bg-white px-5 py-5">
          <h2 className="text-2xl font-medium text-foreground">
            Добавить дистанцию
          </h2>
          <form action={addCompetitionDistance} className="mt-4 grid gap-3 md:grid-cols-4">
            <input name="competitionId" type="hidden" value={competition.id} />
            <select className="min-h-11 border border-border px-3" name="discipline">
              {Object.values(Discipline).map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
            <input className="min-h-11 border border-border px-3" name="distanceLabel" placeholder="Дистанция" required />
            <input className="min-h-11 border border-border px-3" name="protocolUrl" placeholder="Протокол" type="url" />
            <button className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white" type="submit">
              Добавить
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
