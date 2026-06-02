import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAdmin } from "@/app/cabinet/actions";
import {
  listAdminUsers,
  listAthletesForAdmin,
  listEvents,
  listPendingSubmissions,
} from "@/lib/db";
import { hasAdminSession } from "@/lib/session";

const sections = [
  {
    href: "/admin/events",
    title: "Соревнования",
    text: "Карточки стартов, дистанции, ссылки на протоколы и импорт.",
  },
  {
    href: "/admin/athletes",
    title: "Участники",
    text: "Профили спортсменов, ручные правки и история результатов.",
  },
  {
    href: "/admin/submissions",
    title: "Подтверждение результатов",
    text: "Очередь заявок, проверка протоколов, подтверждение и отклонение.",
  },
  {
    href: "/admin/broadcasts",
    title: "Рассылки",
    text: "Подготовка сообщений для Telegram-аудитории и фильтров получателей.",
  },
];

export default async function AdminDashboardPage() {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const [submissions, events, athletes, admins] = await Promise.all([
    listPendingSubmissions(),
    listEvents(),
    listAthletesForAdmin(),
    listAdminUsers(),
  ]);
  const eventsWithoutProtocol = events.filter((event) => !event.sourceUrl).length;
  const importNeedsReview = events.filter(
    (event) => event.sourceUrl && event.protocolRowsCount === 0,
  ).length;

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Админ-панель
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              Управление рейтингом сезона
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Основной рабочий интерфейс администратора: соревнования,
              участники, подтверждение результатов и будущие Telegram-рассылки.
            </p>
          </div>
          <form action={logoutAdmin}>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
              type="submit"
            >
              Выйти
            </button>
          </form>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">На проверке</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {submissions.length}
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">Соревнований без протокола</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {eventsWithoutProtocol}
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">Участников</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {athletes.length}
            </p>
          </article>
          <article className="border border-border bg-white px-5 py-4">
            <p className="text-sm text-muted">Импорт требует внимания</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {importNeedsReview}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {sections.map((section) => (
            <Link
              className="border border-border bg-white px-5 py-5 transition hover:bg-surface-strong"
              href={section.href}
              key={section.href}
            >
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{section.text}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="border border-border bg-white">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-2xl font-medium text-foreground">
                Последние заявки на проверке
              </h2>
            </div>
            <div className="divide-y divide-border">
              {submissions.slice(0, 5).map((submission) => (
                <Link
                  className="block px-5 py-4 transition hover:bg-surface-strong"
                  href="/admin/submissions"
                  key={submission.id}
                >
                  <p className="font-semibold text-foreground">
                    {submission.eventNameRaw}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {submission.athlete.firstName} {submission.athlete.lastName} ·{" "}
                    {submission.finishTimeRaw}
                  </p>
                </Link>
              ))}
              {submissions.length === 0 ? (
                <div className="px-5 py-8 text-sm text-muted">Очередь пуста.</div>
              ) : null}
            </div>
          </article>

          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Администраторы
            </h2>
            <div className="mt-4 grid gap-3">
              {admins.map((admin) => (
                <div className="border border-border px-4 py-3" key={admin.id}>
                  <p className="font-semibold text-foreground">
                    {admin.email ?? "Без email"}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
