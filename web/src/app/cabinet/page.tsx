import Link from "next/link";

import {
  createAdminUserByAdmin,
  createAthleteUserByAdmin,
  createCompetitionCard,
  logoutAdmin,
  logoutAthlete,
  removeAthleteAccount,
  removeAthleteSubmission,
  saveAthleteProfileSettings,
} from "@/app/cabinet/actions";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { TechnicalNote } from "@/components/technical-note";
import {
  getAthleteProfileByUserId,
  getPublicAthleteProfile,
  listAdminUsers,
  listAthletesForAdmin,
  listEvents,
  listPendingSubmissions,
  listSubmissionsForUser,
} from "@/lib/db";
import { hasAdminSession, getAthleteUserSession } from "@/lib/session";
import { formatDate } from "@/lib/time";
import { Discipline } from "@prisma/client";

function formatDisciplineLabel(value: Discipline) {
  if (value === Discipline.RUNNING) return "Бег";
  if (value === Discipline.CYCLING) return "Велоспорт";
  if (value === Discipline.SWIMMING) return "Плавание";
  return "Триатлон";
}

function statusLabel(status: string) {
  if (status === "VERIFIED") return "Подтвержден";
  if (status === "REJECTED") return "Отклонен";
  return "На проверке";
}

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ adminError?: string }>;
}) {
  const [adminSession, athleteUserId, { adminError }] = await Promise.all([
    hasAdminSession(),
    getAthleteUserSession(),
    searchParams,
  ]);

  if (adminSession) {
    const [submissions, events, athletes, admins] = await Promise.all([
      listPendingSubmissions(),
      listEvents(),
      listAthletesForAdmin(),
      listAdminUsers(),
    ]);

    const upcomingEvents = events.filter((event) => !event.isPast).slice(0, 6);
    const pastEvents = events.filter((event) => event.isPast).slice(0, 6);

    return (
      <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Кабинет администратора
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
                  Управление рейтингом, соревнованиями и участниками
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                  Здесь собраны основные рабочие контуры: карточки соревнований,
                  спортсмены, администраторы и очередь подтверждения результатов.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-white"
                  href="/cabinet/submissions"
                >
                  Полная очередь проверки
                </Link>
                <form action={logoutAdmin}>
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    type="submit"
                  >
                    Выйти из админки
                  </button>
                </form>
              </div>
            </div>
          </article>

          <section aria-label="Сводка администратора" className="grid gap-4 md:grid-cols-4">
            <Link
              className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="/cabinet/submissions"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted">На проверке</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-accent-strong">
                  {submissions.length}
                </p>
                <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
            <Link
              className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="/cabinet/competitions"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Соревнований</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-accent-strong">{events.length}</p>
                <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
            <Link
              className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="/cabinet/athletes"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Спортсменов</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-accent-strong">{athletes.length}</p>
                <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
            <Link
              className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-5 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              href="#administrators"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Администраторов</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-accent-strong">{admins.length}</p>
                <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-y-1">↓</span>
              </div>
            </Link>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
              <div className="border-b border-border pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Новая карточка соревнования
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  Создать соревнование заранее или под протокол
                </h2>
              </div>
              <form action={createCompetitionCard} className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-foreground">
                    Название
                    <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="name" required />
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Дата соревнования
                    <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="eventDate" required type="date" />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-foreground">
                    Дисциплина
                    <select className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="discipline" required>
                      {Object.values(Discipline).map((discipline) => (
                        <option key={discipline} value={discipline}>
                          {formatDisciplineLabel(discipline)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Дистанция
                    <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="distanceLabel" required />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-foreground">
                    Место проведения
                    <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="location" />
                  </label>
                  <label className="text-sm font-medium text-foreground">
                    Ссылка на протокол
                    <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" name="protocolUrl" type="url" />
                  </label>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Если ссылка ведет на поддержанный протокол `runc.run` или `grom.place`, система после сохранения автоматически загрузит строки протокола в базу данных события.
                </p>
                <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
                  Создать карточку соревнования
                </button>
              </form>
            </article>

            <div className="grid gap-6">
              <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Добавить спортсмена
                </p>
                {adminError === "athlete_create_invalid" ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    Проверьте данные спортсмена: обязательны корректные имя, фамилия, email, дата рождения, пол и пароль от 8 символов.
                  </div>
                ) : null}
                <form action={createAthleteUserByAdmin} className="mt-5 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="firstName" placeholder="Имя" required />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="lastName" placeholder="Фамилия" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="middleName" placeholder="Отчество" />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="city" placeholder="Город" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="email" placeholder="Email" required type="email" />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" name="birthDate" required type="date" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="rounded-2xl border border-border bg-white px-4 py-3" name="gender" required>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" minLength={8} name="password" placeholder="Временный пароль" required type="password" />
                  </div>
                  <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong" type="submit">
                    Создать пользователя-спортсмена
                  </button>
                </form>
              </article>

              <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Добавить администратора
                </p>
                <form action={createAdminUserByAdmin} className="mt-5 grid gap-4">
                  <input className="rounded-2xl border border-border bg-white px-4 py-3" name="email" placeholder="Email администратора" required type="email" />
                  <input className="rounded-2xl border border-border bg-white px-4 py-3" minLength={8} name="password" placeholder="Пароль администратора" required type="password" />
                  <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-surface-strong" type="submit">
                    Выдать права администратора
                  </button>
                </form>
              </article>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                    Соревнования
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                    Будущие и прошедшие старты
                  </h2>
                </div>
                <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href="/events">
                  Открыть публичный список
                </Link>
              </div>
              <div className="mt-6 grid gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Будущие</p>
                  <div className="mt-3 grid gap-3">
                    {upcomingEvents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
                        Пока нет будущих стартов.
                      </div>
                    ) : (
                      upcomingEvents.map((event) => (
                        <article
                          className="group relative rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 transition hover:border-accent/40 hover:bg-white focus-within:border-accent/40"
                          key={event.id}
                        >
                          <Link
                            aria-label={`Редактировать соревнование «${event.name}»`}
                            className="absolute inset-0 rounded-[1.5rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            href={`/cabinet/events/${event.id}/edit`}
                          />
                          <div className="pointer-events-none relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm uppercase tracking-[0.16em] text-muted">
                                {formatDate(event.eventDate)} • {formatDisciplineLabel(event.discipline)}
                              </p>
                              <p className="mt-2 text-lg font-semibold text-accent-strong">{event.name}</p>
                              <p className="mt-1 text-sm text-muted">
                                {event.distanceLabel} • {event.location ?? "Локация уточняется"}
                              </p>
                            </div>
                            <div className="pointer-events-auto relative flex gap-3">
                              <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href={`/events/${event.id}`}>
                                Публичная карточка
                              </Link>
                              <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
                                Редактировать
                              </span>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Прошедшие</p>
                  <div className="mt-3 grid gap-3">
                    {pastEvents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
                        Подтвержденных прошедших стартов пока нет.
                      </div>
                    ) : (
                      pastEvents.map((event) => (
                        <article
                          className="group relative rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 transition hover:border-accent/40 hover:bg-white focus-within:border-accent/40"
                          key={event.id}
                        >
                          <Link
                            aria-label={`Редактировать соревнование «${event.name}»`}
                            className="absolute inset-0 rounded-[1.5rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            href={`/cabinet/events/${event.id}/edit`}
                          />
                          <div className="pointer-events-none relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="text-sm uppercase tracking-[0.16em] text-muted">
                                {formatDate(event.eventDate)} • {event.participantsCount} подтвержденных участников
                              </p>
                              <p className="mt-2 text-lg font-semibold text-accent-strong">{event.name}</p>
                            </div>
                            <div className="pointer-events-auto relative flex gap-3">
                              <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href={`/events/${event.id}`}>
                                Карточка соревнования
                              </Link>
                              <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
                                Редактировать
                              </span>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
              <div className="border-b border-border pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Очередь подтверждения
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  Последние заявки на проверке
                </h2>
              </div>
              <div className="mt-6 grid gap-3">
                {submissions.slice(0, 5).map((submission) => (
                  <Link
                    className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    href={`/cabinet/submissions?submissionId=${encodeURIComponent(submission.id)}`}
                    key={submission.id}
                  >
                    <p className="text-sm uppercase tracking-[0.16em] text-muted">
                      {formatDate(submission.eventDate)} • {formatDisciplineLabel(submission.discipline)}
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <p className="text-lg font-semibold text-accent-strong">
                        {submission.eventNameRaw}
                      </p>
                      <span aria-hidden="true" className="text-lg text-accent transition-transform group-hover:translate-x-1">→</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {submission.athlete.firstName} {submission.athlete.lastName} • {submission.finishTimeRaw}
                    </p>
                  </Link>
                ))}
                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-4 text-sm text-muted">
                    Очередь сейчас пуста.
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
              <div className="border-b border-border pb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                  Спортсмены
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
                  Карточки пользователей рейтинга
                </h2>
              </div>
              <div className="mt-6 grid gap-3">
                {athletes.slice(0, 10).map((athlete) => (
                  <Link
                    className="group rounded-[1.5rem] border border-border bg-white/75 px-5 py-4 transition hover:border-accent/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    href={`/cabinet/athletes/${athlete.id}`}
                    key={athlete.id}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-accent-strong">{athlete.displayName}</p>
                        <p className="mt-1 text-sm text-muted">
                          {athlete.user.email ?? "Email не указан"} • {athlete._count.submissions} заявок • {athlete._count.verifiedResults} подтверждено
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-muted">
                          Место: {athlete.rankingEntry?.rank ?? "—"}
                        </p>
                        <span className="text-sm font-semibold text-accent transition-transform group-hover:translate-x-1">
                          Открыть карточку
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article
              className="scroll-mt-24 rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]"
              id="administrators"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Администраторы
              </p>
              <div className="mt-5 grid gap-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="rounded-[1.25rem] border border-border bg-white/75 px-4 py-4">
                    <p className="text-base font-semibold text-accent-strong">
                      {admin.email ?? "Без email"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Создан: {formatDate(admin.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <TechnicalNote title="Текущее ограничение входа">
                  В админский кабинет можно входить либо через env-админа, либо через созданных здесь пользователей с ролью `ADMIN`. Это уже убирает ограничение “только программно”, но пока без отдельной RBAC-системы и 2FA.
                </TechnicalNote>
              </div>
            </article>
          </section>
        </section>
      </main>
    );
  }

  const profile = athleteUserId
    ? await getAthleteProfileByUserId(athleteUserId)
    : null;

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
            Войдите или зарегистрируйтесь, чтобы управлять результатами и публичной карточкой спортсмена.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" href="/login">
              Войти
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 py-3 text-base font-semibold text-accent-strong transition hover:bg-white" href="/register">
              Зарегистрироваться
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const [submissions, publicCard] = await Promise.all([
    listSubmissionsForUser(profile.userId),
    getPublicAthleteProfile(profile.id),
  ]);

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Кабинет спортсмена
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
                {profile.firstName} {profile.lastName}
              </h1>
            </div>
            <form action={logoutAthlete}>
              <button className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white" type="submit">
                Выйти
              </button>
            </form>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Текущее место</p>
              <p className="mt-2 text-3xl font-semibold text-accent-strong">
                {publicCard?.rank ?? "—"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Очки рейтинга</p>
              <p className="mt-2 text-3xl font-semibold text-accent-strong">
                {publicCard?.totalPoints ?? 0}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Публичный профиль</p>
              <p className="mt-2 text-lg font-semibold text-accent-strong">
                {profile.showPublicResults ? "Результаты открыты" : "Результаты скрыты"}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Следующее действие
          </p>
          <h2 className="mt-4 text-2xl font-semibold">Добавить или обновить старт</h2>
          <p className="mt-4 text-sm leading-7 text-white/82">
            Новый или измененный результат снова попадет на подтверждение администратору. Так сохраняется прозрачная история расчета рейтинга.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-strong px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0f2d43]" href="/results/new">
              Добавить результат
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10" href="/leaderboard">
              Публичный рейтинг
            </Link>
          </div>
        </article>
      </section>

      <section className="mx-auto mt-6 grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
          <div className="border-b border-border pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Публичный профиль
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
              Настройки видимости и имени
            </h2>
          </div>
          <form action={saveAthleteProfileSettings} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Имя
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={profile.firstName} name="firstName" required />
              </label>
              <label className="text-sm font-medium text-foreground">
                Фамилия
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={profile.lastName} name="lastName" required />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Отчество
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={profile.middleName} name="middleName" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Город
                <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={profile.city} name="city" required />
              </label>
            </div>
            <label className="text-sm font-medium text-foreground">
              Имя в публичной карточке
              <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={profile.publicDisplayName} name="publicDisplayName" />
            </label>
            <label className="flex items-start gap-3 rounded-[1.5rem] border border-border bg-white/75 px-4 py-4 text-sm text-foreground">
              <input className="mt-1 h-4 w-4" defaultChecked={profile.showPublicResults} name="showPublicResults" type="checkbox" />
              Показывать все мои подтвержденные результаты на публичной карточке спортсмена.
            </label>
            <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
              Сохранить настройки профиля
            </button>
          </form>
        </article>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
          <div className="border-b border-border pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Профиль сезона
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-accent-strong">
              Базовые данные спортсмена
            </h2>
          </div>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Email</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">{profile.email}</dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Возраст сезона</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">{profile.seasonAge}</dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Возрастная группа</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">{profile.seasonAgeGroup}</dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Сезон</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">{profile.seasonYear}</dd>
            </div>
          </dl>
          <form action={removeAthleteAccount} className="mt-6">
            <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100" type="submit">
              Удалить профиль
            </button>
          </form>
        </article>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Мои результаты
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-accent-strong">
              История заявок и подтверждений
            </h2>
          </div>
          <p className="text-sm leading-6 text-muted">
            При редактировании результат снова уйдет на подтверждение. Это касается и уже подтвержденных стартов.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
            Результатов пока нет. Добавьте первый старт, чтобы он попал в очередь проверки.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {submissions.map((submission) => (
              <article key={submission.id} className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted">
                      {formatDisciplineLabel(submission.discipline)} • {submission.distanceLabel}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-accent-strong">
                      {submission.eventNameRaw}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {formatDate(submission.eventDate)} • Время: {submission.finishTimeRaw}
                      {submission.placementOverall ? ` • Абсолют: ${submission.placementOverall}` : ""}
                      {submission.placementInAgeGroup ? ` • Группа: ${submission.placementInAgeGroup}` : ""}
                    </p>
                    {submission.verifiedResult ? (
                      <ScoreBreakdown
                        ageGroupUsed={submission.verifiedResult.ageGroupUsed}
                        awardedPoints={submission.verifiedResult.awardedPoints}
                        basePoints={submission.verifiedResult.scoreRule.basePoints}
                        compact
                        fifthPlaceTimeSeconds={submission.verifiedResult.fifthPlaceTimeSeconds}
                        lagPercent={submission.verifiedResult.lagPercent.toString()}
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <div className={`inline-flex rounded-full px-4 py-2 text-sm font-medium ${
                      submission.status === "VERIFIED"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : submission.status === "REJECTED"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {statusLabel(submission.status)}
                    </div>
                    <div className="flex gap-3">
                      <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href={`/results/${submission.id}/edit`}>
                        Редактировать
                      </Link>
                      <form action={removeAthleteSubmission}>
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <button className="text-sm font-semibold text-red-700 underline-offset-4 hover:underline" type="submit">
                          Удалить
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
                {submission.adminNotes ? (
                  <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted">
                    Комментарий администратора: {submission.adminNotes}
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
