import Link from "next/link";
import { redirect } from "next/navigation";

import {
  approveProposal,
  rejectProposal,
  reviewLinkRequest,
} from "@/app/cabinet/management-actions";
import {
  approveSubmission,
  logoutAdmin,
  rejectSubmission,
  seedDemoData,
} from "@/app/cabinet/submissions/actions";
import {
  asJsonObject,
  listEntityProposals,
  listPendingAthleteLinkRequests,
} from "@/lib/cyclon-service";
import {
  getCategoryOptionsForDiscipline,
  listPendingSubmissions,
} from "@/lib/db";
import { hasAdminSession } from "@/lib/session";
import { formatDate, formatDurationFromSeconds } from "@/lib/time";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submissionId?: string }>;
}) {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/cabinet/admin-login");
  }

  const { error, submissionId } = await searchParams;
  const [submissions, proposals, linkRequests] = await Promise.all([
    listPendingSubmissions(),
    listEntityProposals(),
    listPendingAthleteLinkRequests(),
  ]);

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
          <div className="flex flex-col items-start gap-3 md:items-end">
            <p className="text-sm leading-6 text-muted">
              Здесь администратор видит заявки из Telegram-бота и текущих
              ручных форм со статусом проверки.
            </p>
            <Link
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
              href="/cabinet"
            >
              В админ-панель
            </Link>
            <form action={logoutAdmin}>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white/80 px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-white"
                type="submit"
              >
                Выйти из админки
              </button>
            </form>
          </div>
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

        {error === "duplicate_verified_submission" ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            Для этой заявки уже существует подтвержденный дубль у того же
            спортсмена. Проверьте карточку заявки
            {submissionId ? ` (${submissionId})` : ""} и отклоните повтор, чтобы
            не задвоить рейтинг.
          </div>
        ) : null}

        {error === "invalid_fifth_place_time" ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            Не удалось разобрать время 5-го места
            {submissionId ? ` для заявки ${submissionId}` : ""}. Используйте
            формат вроде `41:50` или `01:28:20`.
          </div>
        ) : null}

        {error === "missing_scoring_input" ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            Для подтверждения заявки нужны категория дистанции и время 5-го
            места{submissionId ? ` (${submissionId})` : ""}.
          </div>
        ) : null}

        {error === "manual_review_reason_required" ? (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
            Для ручного подтверждения спорного кейса нужен комментарий
            модератора{submissionId ? ` по заявке ${submissionId}` : ""}:
            зафиксируйте, на каком основании результат принят.
          </div>
        ) : null}

        {submissions.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/65 px-6 py-8 text-sm leading-7 text-muted">
            Сейчас очередь пуста. Добавьте старт из кабинета спортсмена, чтобы
            проверить moderation flow end-to-end.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="hidden rounded-[1.5rem] border border-border bg-surface/80 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted lg:grid lg:grid-cols-[1.1fr_1.5fr_0.9fr_0.9fr_1fr] lg:gap-4">
              <span>Имя</span>
              <span>Соревнование</span>
              <span>Результат</span>
              <span>5-е место</span>
              <span className="text-right">Действия</span>
            </div>
            {submissions.map((submission) => {
              const benchmarkTime = submission.moderationSummary
                .suggestedFifthPlaceTimeSeconds
                ? formatDurationFromSeconds(
                    submission.moderationSummary.suggestedFifthPlaceTimeSeconds,
                  )
                : "";
              const hasAgeGroupMismatch =
                !submission.moderationSummary.claimedAgeGroupMatchesProfile &&
                Boolean(submission.moderationSummary.profileAgeGroup);
              const requiresManualNotes =
                !submission.moderationSummary.hasProtocolUrl ||
                hasAgeGroupMismatch;
              const quickApproveReady = Boolean(
                submission.moderationSummary.matchedEventCategoryKey &&
                  benchmarkTime &&
                  !requiresManualNotes,
              );
              const isExpanded = submissionId === submission.id;

              return (
                <article
                  id={`submission-${submission.id}`}
                  key={submission.id}
                  className="rounded-[1.5rem] border border-border bg-white/80"
                >
                  <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.1fr_1.5fr_0.9fr_0.9fr_1fr] lg:items-start lg:px-6">
                    <div>
                      <p className="text-base font-semibold text-accent-strong">
                        {submission.athlete.firstName} {submission.athlete.lastName}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {submission.athlete.user.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-accent-strong">
                        {submission.eventNameRaw}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {submission.discipline} • {submission.distanceLabel} •{" "}
                        {formatDate(submission.eventDate)}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {submission.matchedEvent
                          ? "Событие уже есть в каталоге"
                          : "Будет создано новое событие"}
                      </p>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-accent-strong">
                        {submission.finishTimeRaw}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        Группа: {submission.ageGroupClaimed}
                      </p>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-accent-strong">
                        {benchmarkTime || "Нужно указать"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {submission.moderationSummary.matchedEventCategoryLabel ??
                          "Категория не определена"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-surface"
                        href={
                          isExpanded
                            ? "/cabinet/submissions"
                            : `/cabinet/submissions?submissionId=${encodeURIComponent(
                                submission.id,
                              )}#submission-${submission.id}`
                        }
                      >
                        {isExpanded ? "Свернуть" : "Редактировать"}
                      </Link>
                      <form action={rejectSubmission}>
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <input name="notes" type="hidden" value="" />
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          type="submit"
                        >
                          Отклонить
                        </button>
                      </form>
                      <form action={approveSubmission}>
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <input
                          name="categoryKey"
                          type="hidden"
                          value={submission.moderationSummary.matchedEventCategoryKey ?? ""}
                        />
                        <input name="fifthPlaceTime" type="hidden" value={benchmarkTime} />
                        <input
                          name="eventLocation"
                          type="hidden"
                          value={submission.matchedEvent?.location ?? ""}
                        />
                        <input
                          name="placementOverall"
                          type="hidden"
                          value={submission.placementOverall ?? ""}
                        />
                        <input
                          name="placementInAgeGroup"
                          type="hidden"
                          value={submission.placementInAgeGroup ?? ""}
                        />
                        <input name="notes" type="hidden" value="" />
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                          disabled={!quickApproveReady}
                          title={
                            quickApproveReady
                              ? "Подтвердить с текущими подсказками"
                              : "Нужно открыть редактирование и заполнить недостающие поля"
                          }
                          type="submit"
                        >
                          Одобрить
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="border-t border-border/80 px-5 py-3 text-sm text-muted lg:px-6">
                    <div className="flex flex-wrap gap-2">
                      {!submission.moderationSummary.hasProtocolUrl ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                          Нет публичного протокола
                        </span>
                      ) : null}
                      {hasAgeGroupMismatch ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                          Группа не совпадает с профилем
                        </span>
                      ) : null}
                      {submission.moderationSummary.relatedSubmissions.length > 0 ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                          Есть другие заявки на этот старт
                        </span>
                      ) : null}
                      {submission.protocolUrl ? (
                        <a
                          className="rounded-full border border-border bg-surface px-3 py-1 text-accent underline-offset-4 hover:underline"
                          href={submission.protocolUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Открыть протокол
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="border-t border-border bg-surface/60 px-5 py-6 lg:px-6">
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.9fr)]">
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
                          <div className="mt-3 grid gap-3">
                            {!submission.moderationSummary.hasProtocolUrl ? (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                                У заявки нет ссылки на публичный протокол. По правилам
                                это ручная проверка: лучше добавить в комментарий,
                                на основании чего результат был подтвержден.
                              </div>
                            ) : null}

                            {hasAgeGroupMismatch ? (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                                Заявленная возрастная группа не совпадает с профилем
                                спортсмена: в заявке указано{" "}
                                <span className="font-semibold">
                                  {submission.ageGroupClaimed}
                                </span>
                                , а в профиле сейчас{" "}
                                <span className="font-semibold">
                                  {submission.moderationSummary.profileAgeGroup}
                                </span>
                                . Проверьте merged age groups или ошибку ввода.
                              </div>
                            ) : null}
                          </div>
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
                          {submission.matchedEvent ? (
                            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                              Для этого старта уже есть нормализованная карточка
                              события. При подтверждении заявка привяжется к existing
                              event вместо создания нового дубля.
                              {submission.moderationSummary.matchedEventCategoryLabel ? (
                                <div className="mt-2 text-emerald-900">
                                  Текущая категория события:{" "}
                                  {
                                    submission.moderationSummary
                                      .matchedEventCategoryLabel
                                  }
                                </div>
                              ) : null}
                              {submission.matchedEvent.location ? (
                                <div className="mt-2 text-emerald-900">
                                  Локация: {submission.matchedEvent.location}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-800">
                              Для такого сочетания названия, даты, дисциплины и
                              дистанции карточка события еще не создана. При
                              подтверждении система заведет новый `Event`.
                            </div>
                          )}
                          {submission.moderationSummary.relatedSubmissions.length > 0 ? (
                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                              Найдены другие заявки этого же спортсмена на тот же
                              старт:
                              <div className="mt-2 space-y-2 text-amber-900">
                                {submission.moderationSummary.relatedSubmissions.map(
                                  (item) => (
                                    <div key={item.id}>
                                      {item.status} • {item.finishTimeRaw} • {item.id}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : null}
                          {submission.comment ? (
                            <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted">
                              Комментарий спортсмена: {submission.comment}
                            </p>
                          ) : null}
                        </div>

                        <div className="w-full rounded-[1.5rem] border border-border bg-white px-4 py-4">
                          <div className="grid gap-3">
                            <form action={approveSubmission} className="grid gap-3">
                              <input name="submissionId" type="hidden" value={submission.id} />
                              <select
                                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                defaultValue={
                                  submission.moderationSummary.matchedEventCategoryKey ??
                                  ""
                                }
                                name="categoryKey"
                                required
                              >
                                <option disabled value="">
                                  Категория дистанции
                                </option>
                                {getCategoryOptionsForDiscipline(
                                  submission.discipline,
                                ).map((option) => (
                                  <option
                                    key={option.categoryKey}
                                    value={option.categoryKey}
                                  >
                                    {option.label} · {option.basePoints} pts
                                  </option>
                                ))}
                              </select>
                              <input
                                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                name="fifthPlaceTime"
                                placeholder="Время 5-го места, например 41:50"
                                defaultValue={benchmarkTime}
                                required
                              />
                              <input
                                className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                defaultValue={submission.matchedEvent?.location ?? ""}
                                name="eventLocation"
                                placeholder="Локация старта, например Москва"
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                  defaultValue={submission.placementOverall ?? ""}
                                  name="placementOverall"
                                  placeholder="Место в абсолюте"
                                />
                                <input
                                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                  defaultValue={submission.placementInAgeGroup ?? ""}
                                  name="placementInAgeGroup"
                                  placeholder="Место в группе"
                                />
                              </div>
                              <textarea
                                className="min-h-24 rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-accent"
                                name="notes"
                                placeholder="Комментарий модератора"
                              />
                              <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
                                <input
                                  className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                  name="confirmNoPublicProtocol"
                                  type="checkbox"
                                />
                                <span>
                                  Подтверждаю, что публичного протокола нет или он
                                  не приложен, и решение принимается вручную.
                                </span>
                              </label>
                              <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
                                <input
                                  className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                  name="confirmMergedAgeGroups"
                                  type="checkbox"
                                />
                                <span>
                                  В опубликованном протоколе возрастные группы
                                  объединены, поэтому результат подтверждается
                                  вручную.
                                </span>
                              </label>
                              <label className="flex items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
                                <input
                                  className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                  name="confirmLessThanFiveFinishers"
                                  type="checkbox"
                                />
                                <span>
                                  В группе меньше 5 финишеров, поэтому benchmark
                                  подтверждается вручную администратором.
                                </span>
                              </label>
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
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">
                Предложения из Telegram
              </p>
              <h2 className="mt-2 text-2xl font-medium text-foreground">
                Соревнования, клубы и тренеры
              </h2>
            </div>
            <span className="text-sm text-muted">{proposals.length}</span>
          </div>
          <div className="mt-4 grid gap-3">
            {proposals.map((proposal) => {
              const payload = asJsonObject(proposal.payloadJson);
              return (
                <article className="border border-border bg-white px-5 py-5" key={proposal.id}>
                  <p className="text-sm font-semibold text-accent">{proposal.type}</p>
                  <p className="mt-2 font-semibold text-foreground">
                    {String(payload.name ?? "Без названия")}
                  </p>
                  {payload.date || payload.distance ? (
                    <p className="mt-1 text-sm text-muted">
                      {String(payload.date ?? "")} · {String(payload.distance ?? "")}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <form action={approveProposal} className="flex gap-2">
                      <input name="proposalId" type="hidden" value={proposal.id} />
                      <input className="min-h-10 flex-1 border border-border px-3 text-sm" name="targetEntityId" placeholder="ID существующей записи для объединения" />
                      <button className="min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white" type="submit">
                        Подтвердить
                      </button>
                    </form>
                    <form action={rejectProposal} className="flex gap-2">
                      <input name="proposalId" type="hidden" value={proposal.id} />
                      <input className="min-h-10 flex-1 border border-border px-3 text-sm" name="notes" placeholder="Причина" />
                      <button className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold" type="submit">
                        Отклонить
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
            {!proposals.length ? (
              <p className="border border-dashed border-border px-5 py-6 text-sm text-muted">
                Новых предложений нет.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">
                Безопасное связывание
              </p>
              <h2 className="mt-2 text-2xl font-medium text-foreground">
                Telegram и существующие атлеты
              </h2>
            </div>
            <span className="text-sm text-muted">{linkRequests.length}</span>
          </div>
          <div className="mt-4 grid gap-3">
            {linkRequests.map((request) => (
              <article className="border border-border bg-white px-5 py-5" key={request.id}>
                <p className="font-semibold text-foreground">
                  Кандидат: {request.candidateAthlete?.firstName}{" "}
                  {request.candidateAthlete?.lastName}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Telegram: @{request.telegramUsername ?? "username отсутствует"} · ID{" "}
                  {request.telegramId}
                </p>
                <form action={reviewLinkRequest} className="mt-4 flex flex-wrap gap-2">
                  <input name="requestId" type="hidden" value={request.id} />
                  <button className="min-h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white" name="decision" type="submit" value="approve">
                    Связать
                  </button>
                  <button className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold" name="decision" type="submit" value="reject">
                    Отклонить
                  </button>
                </form>
              </article>
            ))}
            {!linkRequests.length ? (
              <p className="border border-dashed border-border px-5 py-6 text-sm text-muted">
                Запросов на связывание нет.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
