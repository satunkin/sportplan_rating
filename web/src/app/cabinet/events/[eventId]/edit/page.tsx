import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  removeCompetitionCard,
  saveCompetitionCard,
} from "@/app/cabinet/actions";
import {
  getCategoryOptionsForDiscipline,
  getPublicEventCard,
} from "@/lib/db";
import { hasAdminSession } from "@/lib/session";
import { Discipline } from "@prisma/client";

function formatDateInput(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatDisciplineLabel(value: Discipline) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const { eventId } = await params;
  const event = await getPublicEventCard(eventId);

  if (!event) {
    notFound();
  }

  const categoryOptions = getCategoryOptionsForDiscipline(event.discipline);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Карточка соревнования
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Изменение старта
          </h1>
          <p className="mt-5 text-base leading-7 text-white/82">
            Здесь администратор может обновить название, дату, место, категорию и ссылку на протокол. Все изменения сразу влияют на публичную карточку соревнования.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline" href={`/events/${event.id}`}>
              Публичная карточка
            </Link>
            <Link className="inline-flex text-sm font-medium text-white/85 underline-offset-4 hover:underline" href="/admin/events">
              К списку соревнований
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <form action={saveCompetitionCard} className="grid gap-5">
            <input name="eventId" type="hidden" value={event.id} />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Название
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.name} name="name" required />
              </label>
              <label className="text-sm font-medium text-foreground">
                Дата соревнования
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={formatDateInput(event.eventDate)} name="eventDate" required type="date" />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Дисциплина
                <select className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.discipline} name="discipline" required>
                  {Object.values(Discipline).map((discipline) => (
                    <option key={discipline} value={discipline}>
                      {formatDisciplineLabel(discipline)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Дистанция
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.distanceLabel} name="distanceLabel" required />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Место проведения
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.location ?? ""} name="location" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Ссылка на протокол
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.sourceUrl ?? ""} name="protocolUrl" type="url" />
              </label>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Поддержанные ссылки `runc.run` и `grom.place` после сохранения автоматически обновляют строки протокола в базе этого соревнования.
            </p>
            <label className="text-sm font-medium text-foreground">
              Категория дистанции
              <select className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={event.category?.categoryKey ?? ""} name="categoryKey">
                <option value="">Не выбрано</option>
                {categoryOptions.map((option) => (
                  <option key={option.categoryKey} value={option.categoryKey}>
                    {option.label} • {option.basePoints} pts
                  </option>
                ))}
              </select>
            </label>
            <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
              Сохранить изменения
            </button>
          </form>

          <form action={removeCompetitionCard} className="mt-6">
            <input name="eventId" type="hidden" value={event.id} />
            <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100" type="submit">
              Удалить карточку соревнования
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
