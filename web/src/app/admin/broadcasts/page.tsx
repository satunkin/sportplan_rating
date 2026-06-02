import Link from "next/link";
import { redirect } from "next/navigation";

import { listAthletesForAdmin, listEvents } from "@/lib/db";
import { hasAdminSession } from "@/lib/session";

export default async function AdminBroadcastsPage() {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const [athletes, events] = await Promise.all([
    listAthletesForAdmin(),
    listEvents(),
  ]);
  const ageGroups = Array.from(
    new Set(
      athletes
        .map((athlete) => athlete.seasonAgeGroup)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Админ · рассылки
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              Telegram-рассылки участникам
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              UX-структура раздела готова: фильтры, preview и оценка аудитории.
              Фактическая отправка появится после подключения Telegram-бота.
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
              Получатели
            </h2>
            <form className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-foreground">
                Аудитория
                <select className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3">
                  <option>Все участники</option>
                  <option>Отдельный участник</option>
                  <option>По фильтрам</option>
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Пол
                <select className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3">
                  <option>Любой</option>
                  <option>Мужчины</option>
                  <option>Женщины</option>
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Возрастная категория
                <select className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3">
                  <option>Все категории</option>
                  {ageGroups.map((ageGroup) => (
                    <option key={ageGroup}>{ageGroup}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Участие в старте
                <select className="mt-2 w-full rounded-md border border-border bg-white px-4 py-3">
                  <option>Не важно</option>
                  {events.slice(0, 20).map((event) => (
                    <option key={event.id}>{event.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 text-sm text-muted">
                <label className="flex items-center gap-3">
                  <input type="checkbox" /> Есть подтвержденные результаты
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" /> Нет подтвержденных результатов
                </label>
              </div>
            </form>
          </article>

          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Сообщение и preview
            </h2>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-foreground">
                Текст сообщения
                <textarea
                  className="mt-2 min-h-40 w-full rounded-md border border-border bg-white px-4 py-3"
                  defaultValue="Привет! Проверьте свое место в рейтинге сезона и отправьте недостающие результаты через бота."
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-border px-4 py-4">
                  <p className="text-sm text-muted">Доступно участников</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                    {athletes.length}
                  </p>
                </div>
                <div className="border border-border px-4 py-4">
                  <p className="text-sm text-muted">С Telegram ID</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                    0
                  </p>
                </div>
                <div className="border border-border px-4 py-4">
                  <p className="text-sm text-muted">Готово к отправке</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                    0
                  </p>
                </div>
              </div>
              <div className="border border-border bg-surface-strong px-5 py-5">
                <p className="text-sm font-semibold text-foreground">
                  Preview перед отправкой
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Привет! Проверьте свое место в рейтинге сезона и отправьте
                  недостающие результаты через бота.
                </p>
              </div>
              <button
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-border bg-surface-strong px-5 py-2 text-sm font-semibold text-muted"
                disabled
                type="button"
              >
                Отправка станет доступна после подключения Telegram-бота
              </button>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
