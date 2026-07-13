"use client";

import { CaretDown, CaretUp, Medal } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import type { PublicLeaderboardRow } from "@/lib/public-data-types";

function LeaderboardSection({
  rows,
  title,
  ageFilterActive,
  pagination,
}: {
  rows: PublicLeaderboardRow[];
  title: string;
  ageFilterActive: boolean;
  pagination: ReactNode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(rows[1]?.id ?? null);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_28px_rgba(22,35,54,0.05)]">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
          {ageFilterActive ? (
            <p className="mt-0.5 text-xs text-muted">Место указано в общем рейтинге</p>
          ) : null}
        </div>
        {pagination}
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-semibold">Спортсмены не найдены</p>
          <p className="mt-1 text-sm text-muted">Измените или сбросьте фильтры.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const expanded = expandedId === row.id;
            return (
              <article key={row.id}>
                <button
                  aria-expanded={expanded}
                  className="grid w-full grid-cols-[34px_minmax(0,1fr)_70px_28px] items-center gap-2 px-4 py-3.5 text-left transition hover:bg-surface-strong/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:grid-cols-[44px_minmax(0,1fr)_96px_30px] sm:px-5 lg:grid-cols-[36px_minmax(180px,1fr)_70px_120px_64px_76px_24px] lg:py-2"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                  type="button"
                >
                  <span className={`text-lg font-bold tabular-nums ${row.rank <= 3 ? "text-accent" : "text-foreground"}`}>
                    {row.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground sm:text-base lg:text-sm">{row.athleteName}</span>
                    <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted lg:hidden">
                      <span className="rounded bg-surface-strong px-1.5 py-0.5 font-semibold">{row.ageGroup ?? "—"}</span>
                      <span className="truncate">{row.clubs[0]?.name ?? "Без клуба"}</span>
                      <span>{row.scoredResultsCount} стартов</span>
                    </span>
                  </span>
                  <span className="hidden text-xs text-muted lg:block">{row.ageGroup?.replace(/^[MWМЖ]/i, "") ?? "—"}</span>
                  <span className="hidden truncate text-xs text-muted lg:block">{row.clubs[0]?.name ?? "Без клуба"}</span>
                  <span className="hidden text-xs text-muted lg:block">{row.scoredResultsCount} стартов</span>
                  <span className="text-right">
                    <span className="block text-base font-bold tabular-nums sm:text-lg lg:text-sm">{row.totalPoints}</span>
                    <span className="block text-[11px] text-muted lg:hidden">очков</span>
                  </span>
                  {expanded ? <CaretUp aria-hidden size={18} /> : <CaretDown aria-hidden size={18} />}
                </button>

                {expanded ? (
                  <div className="border-t border-border bg-surface px-4 py-4 sm:px-5">
                    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                      {row.coaches.map((coach) => (
                        <Link className="font-semibold text-accent hover:underline" href={`/coaches/${coach.id}`} key={coach.id}>Тренер: {coach.name}</Link>
                      ))}
                      {row.clubs.map((club) => (
                        <Link className="font-semibold text-accent hover:underline" href={`/clubs/${club.id}`} key={club.id}>{club.name}</Link>
                      ))}
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                      <ResultGroup results={row.results.filter((result) => result.counted)} title="Зачётные старты (3 лучших)" />
                      <ResultGroup results={row.results.filter((result) => !result.counted)} title="Резерв (не в зачёте)" />
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ResultGroup({ results, title }: { results: PublicLeaderboardRow["results"]; title: string }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-2 text-xs font-bold text-foreground">{title}</h3>
      {results.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted">Пока нет результатов.</p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">
          {results.map((result) => (
            <div className="grid grid-cols-[minmax(0,1fr)_66px] gap-2 px-3 py-2 text-[11px] sm:grid-cols-[minmax(0,1fr)_68px_76px_60px] sm:items-center" key={result.id}>
              <span className="min-w-0">
                {result.competitionId ? <Link className="block truncate font-semibold text-foreground hover:underline" href={`/events/${result.competitionId}`}>{result.eventName}</Link> : <span className="block truncate font-semibold">{result.eventName}</span>}
                <span className="block truncate text-muted">{result.distanceLabel}</span>
              </span>
              <span className="text-right font-semibold tabular-nums sm:text-left">{result.finishTime}</span>
              <span className="hidden text-muted sm:block">{result.ageGroupPlacement ? `${result.ageGroupPlacement} в группе` : "Место —"}</span>
              <span className={`col-span-2 inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold sm:col-span-1 ${result.counted ? "bg-blue-50 text-accent" : "bg-surface-strong text-muted"}`}>
                {result.counted ? <Medal size={11} weight="fill" /> : null}{result.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function LeaderboardBoard({
  maleRows,
  femaleRows,
  ageFilterActive,
  malePagination,
  femalePagination,
}: {
  maleRows: PublicLeaderboardRow[];
  femaleRows: PublicLeaderboardRow[];
  ageFilterActive: boolean;
  malePagination: ReactNode;
  femalePagination: ReactNode;
}) {
  const [mobileGender, setMobileGender] = useState<"male" | "female">("male");
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-white sm:hidden">
        <button className={`min-h-11 text-sm font-semibold ${mobileGender === "male" ? "bg-accent text-white" : "hover:bg-surface-strong"}`} onClick={() => setMobileGender("male")} type="button">Мужчины</button>
        <button className={`min-h-11 text-sm font-semibold ${mobileGender === "female" ? "bg-accent text-white" : "hover:bg-surface-strong"}`} onClick={() => setMobileGender("female")} type="button">Женщины</button>
      </div>
      <div className="sm:hidden">
        <LeaderboardSection
          ageFilterActive={ageFilterActive}
          pagination={mobileGender === "male" ? malePagination : femalePagination}
          rows={mobileGender === "male" ? maleRows : femaleRows}
          title={mobileGender === "male" ? "Мужчины" : "Женщины"}
        />
      </div>
      <div className="hidden gap-5 sm:grid">
        <LeaderboardSection ageFilterActive={ageFilterActive} pagination={malePagination} rows={maleRows} title="Мужчины" />
        <LeaderboardSection ageFilterActive={ageFilterActive} pagination={femalePagination} rows={femaleRows} title="Женщины" />
      </div>
    </div>
  );
}
