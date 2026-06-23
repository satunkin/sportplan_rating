import Link from "next/link";
import { redirect } from "next/navigation";

import {
  changeAthleteArchiveStatusByAdmin,
  createAthleteUserByAdmin,
} from "@/app/cabinet/actions";
import { listAthletesForAdmin } from "@/lib/db";
import { hasAdminSession } from "@/lib/session";

export default async function AdminAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ adminError?: string; q?: string }>;
}) {
  const isAdmin = await hasAdminSession();

  if (!isAdmin) {
    redirect("/cabinet/admin-login");
  }

  const { adminError, q } = await searchParams;
  const athletes = await listAthletesForAdmin();
  const normalizedQuery = q?.trim().toLowerCase() ?? "";
  const filteredAthletes = normalizedQuery
    ? athletes.filter((athlete) =>
        [
          athlete.displayName,
          athlete.user.email ?? "",
          athlete.city ?? "",
          athlete.seasonAgeGroup ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : athletes;

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-accent">
              Админ · участники
            </p>
            <h1 className="mt-3 text-4xl font-medium text-foreground">
              Спортсмены рейтинга
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Просмотр, создание и ручная правка профилей участников. Связь с
              Telegram будет добавлена отдельным этапом.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
            href="/cabinet"
          >
            В админ-панель
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <article className="border border-border bg-white px-5 py-5">
            <h2 className="text-2xl font-medium text-foreground">
              Добавить участника
            </h2>
            {adminError === "athlete_create_invalid" ? (
              <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Проверьте имя, email, дату рождения, пол и пароль от 8 символов.
              </div>
            ) : null}
            <form action={createAthleteUserByAdmin} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="firstName"
                  placeholder="Имя"
                  required
                />
                <input
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="lastName"
                  placeholder="Фамилия"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="middleName"
                  placeholder="Отчество"
                />
                <input
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="city"
                  placeholder="Город"
                  required
                />
              </div>
              <input
                className="rounded-md border border-border bg-white px-4 py-3"
                name="email"
                placeholder="Email"
                required
                type="email"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="birthDate"
                  required
                  type="date"
                />
                <select
                  className="rounded-md border border-border bg-white px-4 py-3"
                  name="gender"
                  required
                >
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <input
                className="rounded-md border border-border bg-white px-4 py-3"
                minLength={8}
                name="password"
                placeholder="Временный пароль"
                required
                type="password"
              />
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                type="submit"
              >
                Создать участника
              </button>
            </form>
          </article>

          <article className="border border-border bg-white">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-medium text-foreground">
                Список участников
              </h2>
              <form className="flex gap-2" role="search">
                <input
                  className="min-h-10 rounded-md border border-border bg-white px-3 text-sm"
                  defaultValue={q ?? ""}
                  name="q"
                  placeholder="Поиск"
                />
                <button
                  className="rounded-md border border-border px-4 text-sm font-semibold text-foreground"
                  type="submit"
                >
                  Найти
                </button>
              </form>
            </div>

            <div className="divide-y divide-border">
              {filteredAthletes.length === 0 ? (
                <div className="px-5 py-8 text-sm text-muted">Ничего не найдено.</div>
              ) : (
                filteredAthletes.map((athlete) => (
                  <div
                    className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px]"
                    key={athlete.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-foreground">
                        {athlete.displayName}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {athlete.user.email ?? "email не указан"} ·{" "}
                        {athlete.seasonAgeGroup ?? "группа не указана"} ·{" "}
                        {athlete._count.submissions} заявок ·{" "}
                        {athlete._count.verifiedResults} подтверждено ·{" "}
                        {athlete.status === "ARCHIVED" ? "в архиве" : "активен"}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm md:text-right">
                      <span className="text-muted">
                        Место: {athlete.rankingEntry?.rank ?? "—"}
                      </span>
                      <form action={changeAthleteArchiveStatusByAdmin}>
                        <input name="athleteId" type="hidden" value={athlete.id} />
                        <input
                          name="restore"
                          type="hidden"
                          value={athlete.status === "ARCHIVED" ? "true" : "false"}
                        />
                        <input name="redirectTo" type="hidden" value="/cabinet/athletes" />
                        <button
                          className="font-semibold text-accent underline-offset-4 hover:underline"
                          type="submit"
                        >
                          {athlete.status === "ARCHIVED" ? "Восстановить" : "В архив"}
                        </button>
                      </form>
                      <Link
                        className="font-semibold text-accent underline-offset-4 hover:underline"
                        href={`/cabinet/athletes/${athlete.id}`}
                      >
                        Открыть карточку
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
