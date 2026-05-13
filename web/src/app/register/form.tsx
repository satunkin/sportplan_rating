"use client";

import { useActionState } from "react";

import { registerAthlete, type RegisterState } from "@/app/register/actions";

const initialState: RegisterState = {
  errors: [],
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAthlete,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Имя
          <input className={inputClassName} name="firstName" required />
        </label>

        <label className="text-sm font-medium text-foreground">
          Фамилия
          <input className={inputClassName} name="lastName" required />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Отчество
          <input className={inputClassName} name="middleName" />
        </label>

        <label className="text-sm font-medium text-foreground">
          Город
          <input className={inputClassName} name="city" required />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          Email
          <input
            className={inputClassName}
            name="email"
            required
            type="email"
          />
        </label>

        <label className="text-sm font-medium text-foreground">
          Дата рождения
          <input
            className={inputClassName}
            name="birthDate"
            required
            type="date"
          />
        </label>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium text-foreground">Пол</legend>
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-3 rounded-full border border-border bg-white px-4 py-3 text-sm">
            <input name="gender" required type="radio" value="male" />
            Мужской
          </label>
          <label className="inline-flex items-center gap-3 rounded-full border border-border bg-white px-4 py-3 text-sm">
            <input name="gender" required type="radio" value="female" />
            Женский
          </label>
        </div>
      </fieldset>

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
        {pending ? "Сохраняем профиль..." : "Зарегистрироваться"}
      </button>
    </form>
  );
}
