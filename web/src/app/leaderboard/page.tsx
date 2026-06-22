import Link from "next/link";

import { LeaderboardBoard } from "@/components/leaderboard-board";
import {
  getLeaderboardDirectoryOptions,
  listPublicLeaderboardRows,
} from "@/lib/cyclon-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function pageHref(
  current: Record<string, string | undefined>,
  key: "malePage" | "femalePage",
  page: number,
) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(current)) {
    if (value) params.set(name, value);
  }
  params.set(key, String(page));
  return `/leaderboard?${params.toString()}`;
}

function Pagination({
  current,
  page,
  pages,
  pageKey,
}: {
  current: Record<string, string | undefined>;
  page: number;
  pages: number;
  pageKey: "malePage" | "femalePage";
}) {
  if (pages <= 1) return null;

  return (
    <nav className="mt-3 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link className="font-semibold text-accent" href={pageHref(current, pageKey, page - 1)}>
          ← Назад
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link className="font-semibold text-accent" href={pageHref(current, pageKey, page + 1)}>
          Далее →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    ageGroup?: string;
    club?: string;
    coach?: string;
    malePage?: string;
    femalePage?: string;
  }>;
}) {
  const params = await searchParams;
  const [rows, options] = await Promise.all([
    listPublicLeaderboardRows(),
    getLeaderboardDirectoryOptions(),
  ]);
  const query = params.q?.trim().toLocaleLowerCase("ru") ?? "";

  const filtered = rows.filter((row) => {
    if (query && !row.athleteName.toLocaleLowerCase("ru").includes(query)) {
      return false;
    }
    if (params.ageGroup && params.ageGroup !== row.ageGroup) return false;
    if (params.club && !row.clubs.some((club) => club.id === params.club)) {
      return false;
    }
    if (params.coach && !row.coaches.some((coach) => coach.id === params.coach)) {
      return false;
    }
    return true;
  });

  const male = filtered.filter((row) => row.gender === "MALE");
  const female = filtered.filter((row) => row.gender === "FEMALE");
  const malePages = Math.max(1, Math.ceil(male.length / PAGE_SIZE));
  const femalePages = Math.max(1, Math.ceil(female.length / PAGE_SIZE));
  const malePage = Math.min(
    malePages,
    Math.max(1, Number.parseInt(params.malePage ?? "1", 10) || 1),
  );
  const femalePage = Math.min(
    femalePages,
    Math.max(1, Number.parseInt(params.femalePage ?? "1", 10) || 1),
  );
  const maleRows = male.slice((malePage - 1) * PAGE_SIZE, malePage * PAGE_SIZE);
  const femaleRows = female.slice(
    (femalePage - 1) * PAGE_SIZE,
    femalePage * PAGE_SIZE,
  );

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">Кубок Циклон · 2026</p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">
            Полный рейтинг
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
            Места и очки уже рассчитаны. Поиск и фильтры только сокращают
            отображаемый список и не меняют формулу рейтинга.
          </p>
        </header>

        <form className="grid gap-3 border border-border bg-white px-4 py-4 md:grid-cols-5">
          <input
            className="min-h-11 border border-border px-3 text-sm"
            defaultValue={params.q}
            name="q"
            placeholder="Имя атлета"
          />
          <select
            className="min-h-11 border border-border px-3 text-sm"
            defaultValue={params.ageGroup ?? ""}
            name="ageGroup"
          >
            <option value="">Все группы</option>
            {options.ageGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 border border-border px-3 text-sm"
            defaultValue={params.club ?? ""}
            name="club"
          >
            <option value="">Все клубы</option>
            {options.clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 border border-border px-3 text-sm"
            defaultValue={params.coach ?? ""}
            name="coach"
          >
            <option value="">Все тренеры</option>
            {options.coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.name}
              </option>
            ))}
          </select>
          <button
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white"
            type="submit"
          >
            Применить
          </button>
        </form>

        <LeaderboardBoard maleRows={maleRows} femaleRows={femaleRows} />

        <div className="hidden gap-5 md:grid md:grid-cols-2">
          <Pagination
            current={params}
            page={malePage}
            pageKey="malePage"
            pages={malePages}
          />
          <Pagination
            current={params}
            page={femalePage}
            pageKey="femalePage"
            pages={femalePages}
          />
        </div>
      </section>
    </main>
  );
}
