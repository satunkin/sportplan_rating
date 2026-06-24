import Link from "next/link";

import { LeaderboardBoard } from "@/components/leaderboard-board";
import {
  getLeaderboardDirectoryOptions,
  listPublicLeaderboardRows,
} from "@/lib/cyclon-service";
import { LeaderboardFilterForm } from "./filter-form";

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
    <nav className="mt-4 flex items-center justify-between px-1 text-sm">
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
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Кубок Циклон · 2026
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-accent-strong sm:text-5xl">
            Полный рейтинг
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-muted sm:text-lg">
            Места и очки уже рассчитаны. Поиск и фильтры только сокращают
            отображаемый список и не меняют формулу рейтинга.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-white transition hover:bg-accent-strong"
              href="/rules"
            >
              Посмотреть правила
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-6 py-3 text-base font-semibold text-foreground transition hover:bg-surface-strong"
              href="/events"
            >
              Открыть соревнования
            </Link>
          </div>
        </header>

        <LeaderboardFilterForm
          ageGroups={options.ageGroups}
          clubs={options.clubs}
          coaches={options.coaches}
          key={[params.q, params.ageGroup, params.club, params.coach].join(":")}
        />

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
