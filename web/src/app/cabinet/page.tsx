import Link from "next/link";

import { formatDate } from "@/lib/time";
import { getAthleteProfileByUserId, listSubmissionsForUser } from "@/lib/db";
import { getAthleteUserSession } from "@/lib/session";

export default async function CabinetPage() {
  const userId = await getAthleteUserSession();
  const profile = userId ? await getAthleteProfileByUserId(userId) : null;
  const submissions = userId ? await listSubmissionsForUser(userId) : [];

  if (!profile) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
        <section className="w-full max-w-2xl rounded-[2rem] border border-border bg-surface px-7 py-8 text-center shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Личный кабинет
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-accent-strong">
            Профиль пока не создан
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Зарегистрируйтесь, чтобы увидеть личную карточку спортсмена,
            возрастную группу и следующие этапы рейтинга.
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
            href="/register"
          >
            Перейти к регистрации
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Личный кабинет
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            {profile.firstName} {profile.lastName}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Здесь собраны ваши данные сезона, поданные результаты и текущий
            статус их проверки.
          </p>

          <dl className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">
                Email
              </dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {profile.email}
              </dd>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">
                Город
              </dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {profile.city}
              </dd>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">
                Возраст сезона
              </dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {profile.seasonAge}
              </dd>
            </div>

            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">
                Возрастная группа
              </dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {profile.seasonAgeGroup}
              </dd>
            </div>
          </dl>
        </article>

        <aside className="grid gap-6">
          <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Следующий этап
            </p>
            <h2 className="mt-4 text-2xl font-semibold">Подача результатов</h2>
            <p className="mt-4 text-sm leading-7 text-white/82">
              Foundation для заявок уже готов. Можно начать собирать старты и
              дальше подключать модерацию, scoring engine и публичный рейтинг.
            </p>
            <Link
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-slate-100"
              href="/results/new"
            >
              Добавить результат
            </Link>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Основание расчета
            </p>
            <p className="mt-4 text-base leading-7 text-muted">
              Текущая группа рассчитана по возрасту на конец сезона
              `{profile.seasonYear}`. Это временное правило foundation-версии,
              пока бизнес-регламент не зафиксирован окончательно.
            </p>
            <Link
              className="mt-6 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
              href="/"
            >
              Открыть главную страницу проекта
            </Link>
          </article>
        </aside>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Мои результаты
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-accent-strong">
              Очередь заявок в рейтинг
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted">
            Заявки уже сохраняются в локальной БД. Следующий шаг — полноценная
            админская модерация и подтверждение результатов по протоколам.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
            Заявок пока нет. Добавьте первый старт, чтобы проверить поток
            подачи результатов end-to-end.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted">
                      {submission.discipline} • {submission.distanceLabel}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-accent-strong">
                      {submission.eventNameRaw}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {formatDate(submission.createdAt)} • Группа:{" "}
                      {submission.ageGroupClaimed} • Время:{" "}
                      {submission.finishTimeRaw}
                    </p>
                    {submission.verifiedResult ? (
                      <p className="mt-2 text-sm font-medium text-emerald-700">
                        Начислено очков: {submission.verifiedResult.awardedPoints}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
                      submission.status === "VERIFIED"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : submission.status === "REJECTED"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {submission.status}
                  </div>
                </div>
                {submission.adminNotes ? (
                  <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted">
                    Комментарий модератора: {submission.adminNotes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
