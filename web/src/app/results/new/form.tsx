"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useActionState } from "react";

import {
  submitResult,
  type ResultSubmissionState,
} from "@/app/results/new/actions";
import {
  DISCIPLINE_OPTIONS,
  type DisciplineValue,
  type ResultSubmissionFieldErrors,
  type ResultSubmissionInput,
  validateResultSubmission,
} from "@/lib/result-submission";

const initialState: ResultSubmissionState = {
  errors: [],
  fieldErrors: {},
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent";
const inputErrorClassName =
  "border-red-300 bg-red-50/70 focus:border-red-500";

const CUSTOM_EVENT_VALUE = "__custom__";

type EventOption = {
  id: string;
  name: string;
  eventDate: string;
  discipline: DisciplineValue;
  distanceLabel: string;
  protocolUrl: string;
};

export function ResultSubmissionForm({
  eventOptions,
  suggestedAgeGroup,
}: {
  eventOptions: EventOption[];
  suggestedAgeGroup: string;
}) {
  const initialSelectedEvent = eventOptions[0] ?? null;
  const [state, formAction, pending] = useActionState(
    submitResult,
    initialState,
  );
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialSelectedEvent?.id ?? CUSTOM_EVENT_VALUE,
  );
  const [customEventName, setCustomEventName] = useState("");
  const [eventDate, setEventDate] = useState(
    initialSelectedEvent?.eventDate ?? "",
  );
  const [discipline, setDiscipline] = useState<DisciplineValue | "">(
    initialSelectedEvent?.discipline ?? "",
  );
  const [distanceLabel, setDistanceLabel] = useState(
    initialSelectedEvent?.distanceLabel ?? "",
  );
  const [protocolUrl, setProtocolUrl] = useState(
    initialSelectedEvent?.protocolUrl ?? "",
  );
  const [ageGroupClaimed, setAgeGroupClaimed] = useState(suggestedAgeGroup);
  const [finishTime, setFinishTime] = useState("");
  const [placementOverall, setPlacementOverall] = useState("");
  const [placementInAgeGroup, setPlacementInAgeGroup] = useState("");
  const [comment, setComment] = useState("");
  const [clientFieldErrors, setClientFieldErrors] =
    useState<ResultSubmissionFieldErrors>({});
  const [clientErrors, setClientErrors] = useState<string[]>([]);

  const selectedEvent = useMemo(
    () => eventOptions.find((event) => event.id === selectedEventId) ?? null,
    [eventOptions, selectedEventId],
  );

  const usesCustomEvent = selectedEventId === CUSTOM_EVENT_VALUE;
  const activeFieldErrors =
    Object.keys(clientFieldErrors).length > 0
      ? clientFieldErrors
      : state.fieldErrors;
  const activeErrors = clientErrors.length > 0 ? clientErrors : state.errors;

  function getFieldClassName(fieldError?: string) {
    return `${inputClassName} ${fieldError ? inputErrorClassName : ""}`.trim();
  }

  function clearFieldError(fieldName: keyof ResultSubmissionInput) {
    if (clientFieldErrors[fieldName]) {
      setClientFieldErrors((current) => {
        const next = { ...current };
        delete next[fieldName];
        return next;
      });
    }

    if (clientErrors.length > 0) {
      setClientErrors([]);
    }
  }

  function buildSubmissionInput(): ResultSubmissionInput {
    return {
      eventName: usesCustomEvent ? customEventName : selectedEvent?.name ?? "",
      eventDate,
      discipline: discipline as DisciplineValue,
      distanceLabel,
      ageGroupClaimed,
      finishTime,
      protocolUrl,
      placementOverall,
      placementInAgeGroup,
      comment,
    };
  }

  function applySelectedEvent(eventId: string) {
    setSelectedEventId(eventId);
    setClientFieldErrors({});
    setClientErrors([]);

    if (eventId === CUSTOM_EVENT_VALUE) {
      setEventDate("");
      setDiscipline("");
      setDistanceLabel("");
      setProtocolUrl("");
      return;
    }

    const nextEvent = eventOptions.find((event) => event.id === eventId);

    if (!nextEvent) {
      return;
    }

    setEventDate(nextEvent.eventDate);
    setDiscipline(nextEvent.discipline);
    setDistanceLabel(nextEvent.distanceLabel);
    setProtocolUrl(nextEvent.protocolUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validation = validateResultSubmission(buildSubmissionInput());

    if (!validation.success) {
      event.preventDefault();
      setClientFieldErrors(validation.fieldErrors);
      setClientErrors(validation.errors);
      return;
    }

    setClientFieldErrors({});
    setClientErrors([]);
  }

  return (
    <form action={formAction} className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Название соревнования
          <select
            className={getFieldClassName(activeFieldErrors.eventName)}
            name="eventPreset"
            onChange={(event) => applySelectedEvent(event.target.value)}
            value={selectedEventId}
          >
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
            <option value={CUSTOM_EVENT_VALUE}>Своё соревнование</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-muted">
            Выберите старт из уже добавленных на сайт. Если его нет в списке,
            переключитесь на свой вариант и введите название вручную.
          </span>
          {!usesCustomEvent ? (
            <span className="mt-2 block text-xs leading-5 text-muted">
              Для выбранного старта дата, дисциплина, дистанция и ссылка на
              протокол подставляются автоматически.
            </span>
          ) : null}
        </label>

        <label className="text-sm font-medium text-foreground">
          Дата старта
          <input
            className={getFieldClassName(activeFieldErrors.eventDate)}
            disabled={pending}
            name="eventDate"
            onChange={(event) => {
              setEventDate(event.target.value);
              clearFieldError("eventDate");
            }}
            required
            type="date"
            value={eventDate}
          />
          {activeFieldErrors.eventDate ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.eventDate}
            </span>
          ) : (
            <span className="mt-2 block text-xs leading-5 text-muted">
              Выберите дату в календаре. Год обязателен.
            </span>
          )}
        </label>
      </div>

      {usesCustomEvent ? (
        <label className="text-sm font-medium text-foreground">
          Свое название соревнования
          <input
            className={getFieldClassName(activeFieldErrors.eventName)}
            disabled={pending}
            name="eventName"
            onChange={(event) => {
              setCustomEventName(event.target.value);
              clearFieldError("eventName");
            }}
            placeholder="Введите название соревнования"
            required
            value={customEventName}
          />
          {activeFieldErrors.eventName ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.eventName}
            </span>
          ) : null}
        </label>
      ) : (
        <input name="eventName" type="hidden" value={selectedEvent?.name ?? ""} />
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Дисциплина
          <select
            className={getFieldClassName(activeFieldErrors.discipline)}
            disabled={pending}
            name="discipline"
            onChange={(event) => {
              setDiscipline(event.target.value as DisciplineValue | "");
              clearFieldError("discipline");
            }}
            required
            value={discipline}
          >
            <option disabled value="">
              Выберите дисциплину
            </option>
            {DISCIPLINE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {activeFieldErrors.discipline ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.discipline}
            </span>
          ) : null}
        </label>

        <label className="text-sm font-medium text-foreground">
          Дистанция
          <input
            className={getFieldClassName(activeFieldErrors.distanceLabel)}
            disabled={pending}
            name="distanceLabel"
            onChange={(event) => {
              setDistanceLabel(event.target.value);
              clearFieldError("distanceLabel");
            }}
            placeholder="Например, 10 км или Олимпийка"
            required
            value={distanceLabel}
          />
          {activeFieldErrors.distanceLabel ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.distanceLabel}
            </span>
          ) : null}
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Возрастная группа из протокола
          <input
            className={getFieldClassName(activeFieldErrors.ageGroupClaimed)}
            name="ageGroupClaimed"
            onChange={(event) => {
              setAgeGroupClaimed(event.target.value);
              clearFieldError("ageGroupClaimed");
            }}
            required
            value={ageGroupClaimed}
          />
          {activeFieldErrors.ageGroupClaimed ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.ageGroupClaimed}
            </span>
          ) : null}
        </label>

        <label className="text-sm font-medium text-foreground">
          Итоговое время
          <input
            className={getFieldClassName(activeFieldErrors.finishTime)}
            name="finishTime"
            onChange={(event) => {
              setFinishTime(event.target.value);
              clearFieldError("finishTime");
            }}
            placeholder="Например, 42:15 или 04:38:20"
            required
            value={finishTime}
          />
          {activeFieldErrors.finishTime ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.finishTime}
            </span>
          ) : null}
        </label>
      </div>

      <label className="text-sm font-medium text-foreground">
        Ссылка на официальный протокол
        <input
          className={getFieldClassName(activeFieldErrors.protocolUrl)}
          disabled={pending}
          name="protocolUrl"
          onChange={(event) => {
            setProtocolUrl(event.target.value);
            clearFieldError("protocolUrl");
          }}
          placeholder="https://... (если уже есть)"
          type="url"
          value={protocolUrl}
        />
        {activeFieldErrors.protocolUrl ? (
          <span className="mt-2 block text-xs leading-5 text-red-700">
            {activeFieldErrors.protocolUrl}
          </span>
        ) : null}
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Место в абсолюте
          <input
            className={getFieldClassName(activeFieldErrors.placementOverall)}
            name="placementOverall"
            onChange={(event) => {
              setPlacementOverall(event.target.value);
              clearFieldError("placementOverall");
            }}
            placeholder="Например, 17"
            value={placementOverall}
          />
          {activeFieldErrors.placementOverall ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.placementOverall}
            </span>
          ) : null}
        </label>

        <label className="text-sm font-medium text-foreground">
          Место в возрастной группе
          <input
            className={getFieldClassName(activeFieldErrors.placementInAgeGroup)}
            name="placementInAgeGroup"
            onChange={(event) => {
              setPlacementInAgeGroup(event.target.value);
              clearFieldError("placementInAgeGroup");
            }}
            placeholder="Например, 3"
            value={placementInAgeGroup}
          />
          {activeFieldErrors.placementInAgeGroup ? (
            <span className="mt-2 block text-xs leading-5 text-red-700">
              {activeFieldErrors.placementInAgeGroup}
            </span>
          ) : null}
        </label>
      </div>

      <label className="text-sm font-medium text-foreground">
        Комментарий
        <textarea
          className={`${inputClassName} min-h-28 resize-y`}
          name="comment"
          onChange={(event) => setComment(event.target.value)}
          placeholder="Опционально: особенности старта или пояснение для модератора"
          value={comment}
        />
      </label>

      {activeErrors.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <ul className="grid gap-2">
            {activeErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Сохраняем результат..." : "Отправить на проверку"}
      </button>
    </form>
  );
}
