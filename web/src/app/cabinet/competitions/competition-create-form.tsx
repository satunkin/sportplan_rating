"use client";

import { useState } from "react";

type CompetitionCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

type DistanceRow = {
  id: string;
};

const disciplineOptions = ["RUNNING", "CYCLING", "SWIMMING", "TRIATHLON"];

function createDistanceRow(): DistanceRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()),
  };
}

export function CompetitionCreateForm({ action }: CompetitionCreateFormProps) {
  const [distances, setDistances] = useState<DistanceRow[]>([
    createDistanceRow(),
  ]);

  return (
    <form action={action} className="mt-5 grid gap-3">
      <input
        className="min-h-11 border border-border px-3"
        name="name"
        placeholder="Название"
        required
      />
      <input
        className="min-h-11 border border-border px-3"
        name="eventDate"
        required
        type="date"
      />
      <input
        className="min-h-11 border border-border px-3"
        name="city"
        placeholder="Город"
      />
      <input
        className="min-h-11 border border-border px-3"
        name="seriesName"
        placeholder="Серия, если есть"
      />
      <input
        className="min-h-11 border border-border px-3"
        name="pageUrl"
        placeholder="Официальная страница"
        type="url"
      />
      <input
        className="min-h-11 border border-border px-3"
        name="registrationUrl"
        placeholder="Регистрация"
        type="url"
      />
      <input
        className="min-h-11 border border-border px-3"
        name="resultsUrl"
        placeholder="Страница результатов"
        type="url"
      />

      <fieldset className="mt-2 grid gap-3 border-t border-border pt-4">
        <legend className="text-sm font-semibold text-foreground">
          Дистанции
        </legend>
        {distances.map((distance, index) => (
          <div
            className="grid gap-3 border border-border p-3"
            key={distance.id}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted">
                Дистанция {index + 1}
              </p>
              {distances.length > 1 ? (
                <button
                  className="text-sm font-semibold text-muted"
                  onClick={() =>
                    setDistances((current) =>
                      current.filter((item) => item.id !== distance.id),
                    )
                  }
                  type="button"
                >
                  Убрать
                </button>
              ) : null}
            </div>
            <select
              className="min-h-11 border border-border px-3"
              name="distanceDiscipline"
            >
              {disciplineOptions.map((discipline) => (
                <option key={discipline} value={discipline}>
                  {discipline}
                </option>
              ))}
            </select>
            <input
              className="min-h-11 border border-border px-3"
              name="distanceLabel"
              placeholder="Дистанция"
              required={index === 0}
            />
            <input
              className="min-h-11 border border-border px-3"
              name="distanceProtocolUrl"
              placeholder="Ссылка на протокол"
              type="url"
            />
          </div>
        ))}
        <button
          className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground"
          onClick={() =>
            setDistances((current) => [...current, createDistanceRow()])
          }
          type="button"
        >
          Добавить дистанцию
        </button>
      </fieldset>

      <button
        className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white"
        type="submit"
      >
        Создать
      </button>
    </form>
  );
}
