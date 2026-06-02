import Link from "next/link";
import { redirect } from "next/navigation";

import { createCompetitionCard } from "@/app/cabinet/actions";
import { listEvents } from "@/lib/db";
import { hasAdminSession } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

function formatDisciplineLabel(value: Discipline) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

export default async function AdminEventsPage() {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const events = await listEvents();
  const upcoming = events.filter((event) => !event.isPast);
  const past = events.filter((event) => event.isPast);
  const eventSections = [
    { title: "Будущие", events: upcoming },
    { title: "Прошедшие", events: past },
  ];

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Админ · соревнования
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              Карточки стартов и протоколы
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Создание и редактирование соревнований, запуск импорта протокола
              при сохранении поддержанной ссылки.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
            href="/admin"
          >
            В админ-панель
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Новое соревнование
            </h2>
            <form action={createCompetitionCard} className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-foreground">
                Название
                <input
                  className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                  name="name"
                  required
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Дата
                <input
                  className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                  name="eventDate"
                  required
                  type="date"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Дисциплина
                  <select
                    className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                    name="discipline"
                    required
                  >
                    {Object.values(Discipline).map((discipline) => (
                      <option key={discipline} value={discipline}>
                        {formatDisciplineLabel(discipline)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-foreground">
                  Дистанция
                  <input
                    className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                    name="distanceLabel"
                    required
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-foreground">
                Место проведения
                <input
                  className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                  name="location"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Ссылка на протокол
                <input
                  className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3"
                  name="protocolUrl"
                  type="url"
                />
              </label>
              <p className="text-sm leading-6 text-muted">
                Для `runc.run` и `grom.place` строки протокола загрузятся после
                сохранения карточки.
              </p>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                type="submit"
              >
                Создать соревнование
              </button>
            </form>
          </article>

          <section className="grid gap-6">
            {eventSections.map((section) => (
              <article className="border border-border bg-white" key={section.title}>
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 className="text-2xl font-medium text-foreground">
                    {section.title}
                  </h2>
                  <span className="text-sm text-muted">{section.events.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {section.events.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-muted">Список пуст.</div>
                  ) : (
                    section.events.map((event) => (
                      <div
                        className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px]"
                        key={event.id}
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-muted">
                            {formatDate(event.eventDate)} ·{" "}
                            {formatDisciplineLabel(event.discipline)}
                          </p>
                          <p className="mt-1 truncate text-lg font-semibold text-foreground">
                            {event.name}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {event.distanceLabel} · {event.location ?? "без локации"}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm md:text-right">
                          <span className="text-muted">
                            {event.protocolRowsCount > 0
                              ? `протокол: ${event.protocolRowsCount} строк`
                              : event.sourceUrl
                                ? "ссылка есть, строк нет"
                                : "протокола нет"}
                          </span>
                          <span className="text-muted">
                            {event.participantsCount} подтвержденных участников
                          </span>
                          <div className="flex gap-3 md:justify-end">
                            <Link
                              className="font-semibold text-accent underline-offset-4 hover:underline"
                              href={`/admin/events/${event.id}/edit`}
                            >
                              Редактировать
                            </Link>
                            <Link
                              className="font-semibold text-accent underline-offset-4 hover:underline"
                              href={`/events/${event.id}`}
                            >
                              Публично
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
