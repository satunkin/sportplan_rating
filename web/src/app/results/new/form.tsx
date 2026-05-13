"use client";

import { useActionState } from "react";

import {
  submitResult,
  type ResultSubmissionState,
} from "@/app/results/new/actions";
import { DISCIPLINE_OPTIONS } from "@/lib/result-submission";

const initialState: ResultSubmissionState = {
  errors: [],
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent";

export function ResultSubmissionForm({
  suggestedAgeGroup,
}: {
  suggestedAgeGroup: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitResult,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Название соревнования
          <input className={inputClassName} name="eventName" required />
        </label>

        <label className="text-sm font-medium text-foreground">
          Дата старта
          <input
            className={inputClassName}
            name="eventDate"
            placeholder="Например, 05.04"
            required
            type="text"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Дисциплина
          <select className={inputClassName} defaultValue="" name="discipline" required>
            <option disabled value="">
              Выберите дисциплину
            </option>
            {DISCIPLINE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-foreground">
          Дистанция
          <input
            className={inputClassName}
            name="distanceLabel"
            placeholder="Например, 10 км или Олимпийка"
            required
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Возрастная группа из протокола
          <input
            className={inputClassName}
            defaultValue={suggestedAgeGroup}
            name="ageGroupClaimed"
            required
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Итоговое время
          <input
            className={inputClassName}
            name="finishTime"
            placeholder="Например, 42:15 или 04:38:20"
            required
          />
        </label>
      </div>

      <label className="text-sm font-medium text-foreground">
        Ссылка на официальный протокол
        <input
          className={inputClassName}
          name="protocolUrl"
          placeholder="https://..."
          required
          type="url"
        />
      </label>

      <label className="text-sm font-medium text-foreground">
        Комментарий
        <textarea
          className={`${inputClassName} min-h-28 resize-y`}
          name="comment"
          placeholder="Опционально: особенности старта или пояснение для модератора"
        />
      </label>

      {state.errors.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          <ul className="grid gap-2">
            {state.errors.map((error) => (
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
