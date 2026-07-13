import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { LeaderboardFilterForm } from "@/app/leaderboard/filter-form";
import {
  LeaderboardScrollRestorer,
  ScrollPreservingLink,
} from "@/app/leaderboard/scroll-preserving-link";
import { LeaderboardBoard } from "@/components/leaderboard-board";
import { getLeaderboardDirectoryOptions, listPublicLeaderboardRows } from "@/lib/cyclon-service";
import { isDemoMode } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function normalizeAgeGroup(value: string | null | undefined) {
  return value?.replace(/^[MWМЖ]/i, "") ?? "";
}

function pageHref(current: Record<string, string | undefined>, key: "malePage" | "femalePage", page: number) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(current)) if (value) params.set(name, value);
  params.set(key, String(page));
  return `/leaderboard?${params.toString()}`;
}

function Pagination({ current, page, pages, pageKey, label }: {
  current: Record<string, string | undefined>;
  page: number;
  pages: number;
  pageKey: "malePage" | "femalePage";
  label: string;
}) {
  return (
    <nav
      aria-label={`Страницы рейтинга: ${label}`}
      className="flex items-center overflow-hidden rounded-lg border border-border bg-white text-xs font-semibold"
    >
      {page > 1 ? (
        <ScrollPreservingLink
          ariaLabel={`Предыдущая страница: ${label}`}
          className="grid size-9 place-items-center text-accent transition hover:bg-surface-strong"
          href={pageHref(current, pageKey, page - 1)}
        >
          <ArrowLeft size={15} />
        </ScrollPreservingLink>
      ) : (
        <span aria-disabled="true" className="grid size-9 place-items-center text-muted/35">
          <ArrowLeft size={15} />
        </span>
      )}
      <span className="min-w-12 border-x border-border px-2 py-2 text-center tabular-nums text-muted">
        {page} / {pages}
      </span>
      {page < pages ? (
        <ScrollPreservingLink
          ariaLabel={`Следующая страница: ${label}`}
          className="grid size-9 place-items-center text-accent transition hover:bg-surface-strong"
          href={pageHref(current, pageKey, page + 1)}
        >
          <ArrowRight size={15} />
        </ScrollPreservingLink>
      ) : (
        <span aria-disabled="true" className="grid size-9 place-items-center text-muted/35">
          <ArrowRight size={15} />
        </span>
      )}
    </nav>
  );
}

export default async function LeaderboardPage({ searchParams }: {
  searchParams: Promise<{ q?: string; ageGroup?: string; club?: string; coach?: string; malePage?: string; femalePage?: string }>;
}) {
  const params = await searchParams;
  const [rows, options] = await Promise.all([listPublicLeaderboardRows(), getLeaderboardDirectoryOptions()]);
  const query = params.q?.trim().toLocaleLowerCase("ru") ?? "";
  const selectedAgeGroup = normalizeAgeGroup(params.ageGroup);
  const ageGroups = [...new Set(options.ageGroups.map(normalizeAgeGroup).filter(Boolean))];

  const filtered = rows.filter((row) => {
    if (query && !row.athleteName.toLocaleLowerCase("ru").includes(query)) return false;
    if (selectedAgeGroup && normalizeAgeGroup(row.ageGroup) !== selectedAgeGroup) return false;
    if (params.club && !row.clubs.some((club) => club.id === params.club)) return false;
    if (params.coach && !row.coaches.some((coach) => coach.id === params.coach)) return false;
    return true;
  });

  const male = filtered.filter((row) => row.gender === "MALE");
  const female = filtered.filter((row) => row.gender === "FEMALE");
  const malePages = Math.max(1, Math.ceil(male.length / PAGE_SIZE));
  const femalePages = Math.max(1, Math.ceil(female.length / PAGE_SIZE));
  const malePage = Math.min(malePages, Math.max(1, Number.parseInt(params.malePage ?? "1", 10) || 1));
  const femalePage = Math.min(femalePages, Math.max(1, Number.parseInt(params.femalePage ?? "1", 10) || 1));
  const maleRows = male.slice((malePage - 1) * PAGE_SIZE, malePage * PAGE_SIZE);
  const femaleRows = female.slice((femalePage - 1) * PAGE_SIZE, femalePage * PAGE_SIZE);

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <LeaderboardScrollRestorer />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Кубок Циклон · 2026</p>
              {isDemoMode() ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">DEMO · fixtures</span> : null}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Рейтинг спортсменов</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Сумма трёх лучших подтверждённых результатов. Фильтры не пересчитывают места в абсолютном рейтинге.</p>
          </div>
          <div className="text-sm text-muted"><span className="font-bold text-foreground">{filtered.length}</span> спортсменов найдено</div>
        </header>

        <LeaderboardFilterForm ageGroups={ageGroups} clubs={options.clubs} coaches={options.coaches} />
        <LeaderboardBoard
          ageFilterActive={Boolean(selectedAgeGroup)}
          femalePagination={
            <Pagination current={params} label="Женщины" page={femalePage} pageKey="femalePage" pages={femalePages} />
          }
          femaleRows={femaleRows}
          malePagination={
            <Pagination current={params} label="Мужчины" page={malePage} pageKey="malePage" pages={malePages} />
          }
          maleRows={maleRows}
        />
      </section>
    </main>
  );
}
