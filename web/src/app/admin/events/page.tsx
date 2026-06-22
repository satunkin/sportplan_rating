import Link from "next/link";
import { redirect } from "next/navigation";

import {
  createCompetition,
  setCompetitionArchived,
} from "@/app/admin/management-actions";
import { listAdminCompetitions } from "@/lib/cyclon-service";
import { hasAdminSession } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

export default async function AdminEventsPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const competitions = await listAdminCompetitions();

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">
            Админ · соревнования
          </p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            Соревнования и дистанции
          </h1>
        </header>

        <section className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <article className="h-fit border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Новое соревнование
            </h2>
            <form action={createCompetition} className="mt-5 grid gap-3">
              <input className="min-h-11 border border-border px-3" name="name" placeholder="Название" required />
              <input className="min-h-11 border border-border px-3" name="eventDate" required type="date" />
              <input className="min-h-11 border border-border px-3" name="city" placeholder="Город" />
              <input className="min-h-11 border border-border px-3" name="seriesName" placeholder="Серия, если есть" />
              <input className="min-h-11 border border-border px-3" name="pageUrl" placeholder="Официальная страница" type="url" />
              <input className="min-h-11 border border-border px-3" name="registrationUrl" placeholder="Регистрация" type="url" />
              <input className="min-h-11 border border-border px-3" name="resultsUrl" placeholder="Страница результатов" type="url" />
              <div className="mt-2 border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Первая дистанция
                </p>
                <div className="grid gap-3">
                  <select className="min-h-11 border border-border px-3" name="discipline">
                    {Object.values(Discipline).map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {discipline}
                      </option>
                    ))}
                  </select>
                  <input className="min-h-11 border border-border px-3" name="distanceLabel" placeholder="Дистанция" required />
                  <input className="min-h-11 border border-border px-3" name="protocolUrl" placeholder="Ссылка на протокол" type="url" />
                </div>
              </div>
              <button className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white" type="submit">
                Создать
              </button>
            </form>
          </article>

          <section className="border border-border bg-white">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-2xl font-medium text-foreground">
                Все соревнования
              </h2>
            </div>
            <div className="divide-y divide-border">
              {competitions.map((competition) => (
                <article
                  className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_220px]"
                  key={competition.id}
                >
                  <div>
                    <p className="text-sm text-muted">
                      {formatDate(competition.eventDate)} ·{" "}
                      {competition.city ?? "без города"}
                      {competition.series ? ` · ${competition.series.name}` : ""}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      {competition.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {competition.distances.length} дистанц. ·{" "}
                      {competition.distances.reduce(
                        (sum, item) => sum + item._count.protocolRows,
                        0,
                      )}{" "}
                      строк протоколов
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-3 md:justify-end">
                    <Link
                      className="font-semibold text-accent"
                      href={`/admin/events/${competition.id}/edit`}
                    >
                      Редактировать
                    </Link>
                    <Link
                      className="font-semibold text-accent"
                      href={`/events/${competition.id}`}
                    >
                      Публично
                    </Link>
                    <form action={setCompetitionArchived}>
                      <input name="competitionId" type="hidden" value={competition.id} />
                      <input
                        name="restore"
                        type="hidden"
                        value={competition.status === "ARCHIVED" ? "true" : "false"}
                      />
                      <button className="text-sm font-semibold text-muted" type="submit">
                        {competition.status === "ARCHIVED" ? "Восстановить" : "В архив"}
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
