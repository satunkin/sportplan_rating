import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  addAthleteSubmissionByAdmin,
  changeAthleteArchiveStatusByAdmin,
  removeAthleteSubmissionByAdmin,
  saveAthleteByAdmin,
  saveAthleteSubmissionByAdmin,
} from "@/app/cabinet/actions";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { listAdminDirectories } from "@/lib/cyclon-service";
import { getAdminAthleteDetail } from "@/lib/db";
import { DISCIPLINE_OPTIONS } from "@/lib/result-submission";
import { SCORE_RULES } from "@/lib/scoring";
import { hasAdminSession } from "@/lib/session";
import { formatDate, formatDurationFromSeconds } from "@/lib/time";

function formatSubmissionDate(date: Date) {
  return `${String(date.getUTCDate()).padStart(2, "0")}.${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

function statusLabel(status: string) {
  if (status === "VERIFIED") return "Подтвержден";
  if (status === "REJECTED") return "Отклонен";
  return "На проверке";
}

function adminSubmissionErrorMessage(error?: string) {
  if (error === "submission_invalid") {
    return "Проверьте обязательные поля и формат времени.";
  }

  if (error === "scoring_category_required") {
    return "Не удалось определить категорию рейтинга для расчета очков. Выберите категорию вручную.";
  }

  if (error === "invalid_fifth_place_time") {
    return "Время 5-го места должно быть в формате мм:сс или чч:мм:сс.";
  }

  if (error === "duplicate_submission" || error === "duplicate_verified_submission") {
    return "Такой результат уже есть у спортсмена в очереди или рейтинге.";
  }

  if (error === "submission_save_failed") {
    return "Не удалось сохранить результат. Проверьте данные и попробуйте еще раз.";
  }

  return null;
}

export default async function AdminAthletePage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/cabinet/admin-login");
  }

  const [{ athleteId }, { error }] = await Promise.all([params, searchParams]);
  const [athlete, directories] = await Promise.all([
    getAdminAthleteDetail(athleteId),
    listAdminDirectories(),
  ]);
  const submissionError = adminSubmissionErrorMessage(error);

  if (!athlete) {
    notFound();
  }

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Карточка спортсмена
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-accent-strong">
                {athlete.displayName}
              </h1>
              <p className="mt-4 text-base leading-7 text-muted">
                {athlete.user.email ?? "Email не указан"} • место в рейтинге:{" "}
                {athlete.rankingEntry?.rank ?? "—"} • очки:{" "}
                {athlete.rankingEntry?.totalPoints ?? 0}
              </p>
            </div>
            <div className="flex gap-3">
              <form action={changeAthleteArchiveStatusByAdmin}>
                <input name="athleteId" type="hidden" value={athlete.id} />
                <input
                  name="restore"
                  type="hidden"
                  value={athlete.status === "ARCHIVED" ? "true" : "false"}
                />
                <input
                  name="redirectTo"
                  type="hidden"
                  value={`/cabinet/athletes/${athlete.id}`}
                />
                <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-white" type="submit">
                  {athlete.status === "ARCHIVED" ? "Восстановить спортсмена" : "Перевести в архив"}
                </button>
              </form>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white/80 px-5 py-3 text-sm font-semibold text-accent-strong transition hover:bg-white" href="/cabinet/athletes">
                К списку участников
              </Link>
            </div>
          </div>
        </article>

        {athlete.status === "ARCHIVED" ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            Спортсмен сейчас в архиве. Он скрыт из активного рейтинга и
            публичных выборок, но карточку можно проверить и восстановить.
          </div>
        ) : null}

        {submissionError ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            {submissionError}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <div className="border-b border-border pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Данные спортсмена
              </p>
            </div>
            <form action={saveAthleteByAdmin} className="mt-6 grid gap-4">
              <input name="athleteId" type="hidden" value={athlete.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Имя
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.firstName} name="firstName" required />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Фамилия
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.lastName} name="lastName" required />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Дата рождения
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.birthDate.toISOString().slice(0, 10)} name="birthDate" type="date" />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Пол
                  <select className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.gender} name="gender">
                    <option value="MALE">Мужской</option>
                    <option value="FEMALE">Женский</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Telegram username
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.telegramUsername ?? ""} name="telegramUsername" placeholder="@username" />
                </label>
                <label className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-white/75 px-4 py-4 text-sm text-foreground">
                  <input className="h-4 w-4" defaultChecked={athlete.showTelegramProfile} name="showTelegramProfile" type="checkbox" />
                  Показывать Telegram в рейтинге
                </label>
              </div>
              <fieldset className="border border-border px-4 py-4">
                <legend className="px-2 text-sm font-semibold text-foreground">Клубы</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {directories.clubs.filter((club) => club.status === "ACTIVE").map((club) => (
                    <label className="flex items-center gap-2 text-sm text-foreground" key={club.id}>
                      <input
                        defaultChecked={athlete.clubs.some((item) => item.clubId === club.id)}
                        name="clubIds"
                        type="checkbox"
                        value={club.id}
                      />
                      {club.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="border border-border px-4 py-4">
                <legend className="px-2 text-sm font-semibold text-foreground">Тренеры</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {directories.coaches.filter((coach) => coach.status === "ACTIVE").map((coach) => (
                    <label className="flex items-center gap-2 text-sm text-foreground" key={coach.id}>
                      <input
                        defaultChecked={athlete.coaches.some((item) => item.coachId === coach.id)}
                        name="coachIds"
                        type="checkbox"
                        value={coach.id}
                      />
                      {coach.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Отчество
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.middleName ?? ""} name="middleName" />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Город
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.city ?? ""} name="city" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-foreground">
                  Возрастная группа
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.seasonAgeGroup ?? ""} name="seasonAgeGroup" />
                </label>
                <label className="text-sm font-medium text-foreground">
                  Имя в публичной карточке
                  <input className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.publicDisplayName ?? ""} name="publicDisplayName" />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-[1.5rem] border border-border bg-white/75 px-4 py-4 text-sm text-foreground">
                <input className="mt-1 h-4 w-4" defaultChecked={athlete.showPublicResults} name="showPublicResults" type="checkbox" />
                Показывать все подтвержденные результаты спортсмена на публичной карточке.
              </label>
              <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
                Сохранить данные спортсмена
              </button>
            </form>
          </article>

          <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
            <div className="border-b border-border pb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Новый результат
              </p>
            </div>
            <form action={addAthleteSubmissionByAdmin} className="mt-6 grid gap-4">
              <input name="athleteId" type="hidden" value={athlete.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="eventName" placeholder="Название соревнования" required />
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="eventDate" placeholder="дд.мм" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue="" name="discipline" required>
                  <option disabled value="">
                    Дисциплина
                  </option>
                  {DISCIPLINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="distanceLabel" placeholder="Дистанция" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={athlete.seasonAgeGroup ?? ""} name="ageGroupClaimed" placeholder="Возрастная группа" required />
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="finishTime" placeholder="Время результата" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="placementOverall" placeholder="Место в абсолюте" />
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="placementInAgeGroup" placeholder="Место в группе" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue="" name="categoryKey">
                  <option value="">
                    Категория рейтинга: авто
                  </option>
                  {SCORE_RULES.map((rule) => (
                    <option key={`${rule.discipline}:${rule.categoryKey}`} value={rule.categoryKey}>
                      {rule.label} · {rule.basePoints} pts
                    </option>
                  ))}
                </select>
                <input className="rounded-2xl border border-border bg-white px-4 py-3" name="fifthPlaceTime" placeholder="Результат 5 места в группе" />
              </div>
              <input className="rounded-2xl border border-border bg-white px-4 py-3" name="protocolUrl" placeholder="Ссылка на протокол" type="url" />
              <textarea className="min-h-24 rounded-2xl border border-border bg-white px-4 py-3" name="comment" placeholder="Комментарий администратора или спортсмена" />
              <button className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong" type="submit">
                Добавить результат спортсмену
              </button>
            </form>
          </article>
        </section>

        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_18px_50px_rgba(27,42,51,0.08)]">
          <div className="border-b border-border pb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              История результатов
            </p>
          </div>
          <div className="mt-6 grid gap-5">
            {athlete.submissions.map((submission) => (
              <div key={submission.id} className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-muted">
                      {formatDate(submission.eventDate)} • {submission.distanceLabel}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-accent-strong">
                      {submission.eventNameRaw}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {submission.finishTimeRaw}
                      {submission.placementOverall ? ` • ${submission.placementOverall} абс.` : ""}
                      {submission.placementInAgeGroup ? ` • ${submission.placementInAgeGroup} в группе` : ""}
                    </p>
                  </div>
                  <div className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-accent-strong">
                    {statusLabel(submission.status)}
                  </div>
                </div>

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

                <form action={saveAthleteSubmissionByAdmin} className="mt-5 grid gap-4 border-t border-border pt-5">
                  <input name="athleteId" type="hidden" value={athlete.id} />
                  <input name="submissionId" type="hidden" value={submission.id} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.eventNameRaw} name="eventName" required />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={formatSubmissionDate(submission.eventDate)} name="eventDate" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.discipline} name="discipline" required>
                      {DISCIPLINE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.distanceLabel} name="distanceLabel" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.ageGroupClaimed} name="ageGroupClaimed" required />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.finishTimeRaw} name="finishTime" required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.placementOverall ?? ""} name="placementOverall" />
                    <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.placementInAgeGroup ?? ""} name="placementInAgeGroup" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.verifiedResult?.scoreRule.categoryKey ?? ""} name="categoryKey">
                      <option value="">
                        Категория рейтинга: авто
                      </option>
                      {SCORE_RULES.map((rule) => (
                        <option key={`${submission.id}:${rule.discipline}:${rule.categoryKey}`} value={rule.categoryKey}>
                          {rule.label} · {rule.basePoints} pts
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-2xl border border-border bg-white px-4 py-3"
                      defaultValue={
                        submission.verifiedResult
                          ? formatDurationFromSeconds(
                              submission.verifiedResult.fifthPlaceTimeSeconds,
                            )
                          : ""
                      }
                      name="fifthPlaceTime"
                      placeholder="Результат 5 места в группе"
                    />
                  </div>
                  <input className="rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.protocolUrl ?? ""} name="protocolUrl" type="url" />
                  <textarea className="min-h-24 rounded-2xl border border-border bg-white px-4 py-3" defaultValue={submission.comment ?? ""} name="comment" />
                  <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong" type="submit">
                    Сохранить и отправить на переподтверждение
                  </button>
                </form>
                <form action={removeAthleteSubmissionByAdmin} className="mt-3">
                  <input name="athleteId" type="hidden" value={athlete.id} />
                  <input name="submissionId" type="hidden" value={submission.id} />
                  <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100" type="submit">
                    Удалить результат
                  </button>
                </form>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
