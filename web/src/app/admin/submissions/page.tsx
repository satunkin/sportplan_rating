import { redirect } from "next/navigation";

import {
  approveSubmission,
  rejectSubmission,
  seedDemoData,
} from "@/app/admin/submissions/actions";
import {
  getCategoryOptionsForDiscipline,
  listPendingSubmissions,
} from "@/lib/db";
import { hasAdminSession } from "@/lib/session";
import { formatDate } from "@/lib/time";

export default async function AdminSubmissionsPage() {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/admin/login");
  }

  const submissions = await listPendingSubmissions();

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Admin moderation
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-accent-strong">
              Очередь проверки результатов
            </h1>
          </div>
          <p className="text-sm leading-6 text-muted">
            Здесь администратор видит все заявки со статусом
            `PENDING_MANUAL_REVIEW` и может принять первичное решение.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={seedDemoData}>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              type="submit"
            >
              Загрузить демо-данные
            </button>
          </form>
          <p className="text-sm leading-6 text-muted">
            Создает тестовых спортсменов, результаты и заполненную таблицу
            рейтинга для проверки end-to-end потока.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
            Сейчас очередь пуста. Добавьте старт из кабинета спортсмена, чтобы
            проверить moderation flow end-to-end.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-[1.5rem] border border-border bg-white/75 px-6 py-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-sm uppercase tracking-[0.18em] text-muted">
                      {submission.discipline} • {submission.distanceLabel} •{" "}
                      {formatDate(submission.eventDate)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                      {submission.eventNameRaw}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      Спортсмен: {submission.athlete.firstName}{" "}
                      {submission.athlete.lastName} • Email:{" "}
                      {submission.athlete.user.email}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Группа: {submission.ageGroupClaimed} • Время:{" "}
                      {submission.finishTimeRaw}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Протокол:{" "}
                      <a
                        className="text-accent underline-offset-4 hover:underline"
                        href={submission.protocolUrl ?? "#"}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {submission.protocolUrl ?? "не указана"}
                      </a>
                    </p>
                    {submission.comment ? (
                      <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted">
                        Комментарий спортсмена: {submission.comment}
                      </p>
                    ) : null}
                  </div>

                  <div className="w-full max-w-sm rounded-[1.5rem] border border-border bg-surface px-4 py-4">
                    <div className="grid gap-3">
                      <form action={approveSubmission} className="grid gap-3">
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <select
                          className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                          defaultValue=""
                          name="categoryKey"
                          required
                        >
                          <option disabled value="">
                            Категория дистанции
                          </option>
                          {getCategoryOptionsForDiscipline(submission.discipline).map(
                            (option) => (
                              <option key={option.categoryKey} value={option.categoryKey}>
                                {option.label} · {option.basePoints} pts
                              </option>
                            ),
                          )}
                        </select>
                        <input
                          className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                          name="fifthPlaceTime"
                          placeholder="Время 5-го места, например 41:50"
                          required
                        />
                        <textarea
                          className="min-h-24 rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                          name="notes"
                          placeholder="Комментарий модератора"
                        />
                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                          type="submit"
                        >
                          Подтвердить и рассчитать очки
                        </button>
                      </form>

                      <form action={rejectSubmission} className="grid gap-3">
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <textarea
                          className="min-h-24 rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                          name="notes"
                          placeholder="Причина отклонения"
                        />
                        <button
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                          type="submit"
                        >
                          Отклонить результат
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
