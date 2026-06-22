"use client";

import Link from "next/link";
import { useState } from "react";

export type PublicLeaderboardRow = {
  id: string;
  rank: number;
  totalPoints: number;
  scoredResultsCount: number;
  ageGroup: string | null;
  athleteName: string;
  telegramUsername: string | null;
  clubs: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  results: {
    id: string;
    competitionId: string | null;
    eventName: string;
    distanceLabel: string;
    finishTime: string;
    points: number;
    counted: boolean;
  }[];
};

function LeaderboardColumn({
  rows,
  title,
}: {
  rows: PublicLeaderboardRow[];
  title: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <h2 className="text-xl font-medium text-foreground">{title}</h2>
        <span className="text-sm text-muted">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-10 text-sm text-muted">Ничего не найдено.</p>
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const expanded = expandedId === row.id;

            return (
              <article key={row.id}>
                <button
                  aria-expanded={expanded}
                  className="grid w-full grid-cols-[40px_minmax(0,1fr)_74px] items-center gap-3 px-4 py-4 text-left transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                  type="button"
                >
                  <span className="text-xl font-semibold tabular-nums text-foreground">
                    {row.rank}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">
                      {row.athleteName}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {row.ageGroup ?? "Группа уточняется"} ·{" "}
                      {row.scoredResultsCount} стартов
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-xl font-semibold tabular-nums text-foreground">
                      {row.totalPoints}
                    </span>
                    <span className="block text-xs text-muted">очков</span>
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-border bg-surface-strong px-4 py-4">
                    {row.clubs.length || row.coaches.length || row.telegramUsername ? (
                      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
                        {row.clubs.map((club) => (
                          <Link
                            className="font-medium text-accent underline-offset-4 hover:underline"
                            href={`/clubs/${club.id}`}
                            key={club.id}
                          >
                            {club.name}
                          </Link>
                        ))}
                        {row.coaches.map((coach) => (
                          <Link
                            className="font-medium text-accent underline-offset-4 hover:underline"
                            href={`/coaches/${coach.id}`}
                            key={coach.id}
                          >
                            Тренер: {coach.name}
                          </Link>
                        ))}
                        {row.telegramUsername ? (
                          <a
                            className="font-medium text-accent underline-offset-4 hover:underline"
                            href={`https://t.me/${row.telegramUsername.replace(/^@/, "")}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            @{row.telegramUsername.replace(/^@/, "")}
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="grid gap-2">
                      {row.results.map((result) => (
                        <div
                          className="grid gap-2 border border-border bg-white px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_90px_70px_70px]"
                          key={result.id}
                        >
                          <span className="min-w-0">
                            {result.competitionId ? (
                              <Link
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                                href={`/events/${result.competitionId}`}
                              >
                                {result.eventName}
                              </Link>
                            ) : (
                              <span className="font-medium text-foreground">
                                {result.eventName}
                              </span>
                            )}
                            <span className="mt-1 block text-xs text-muted">
                              {result.distanceLabel}
                            </span>
                          </span>
                          <span className="tabular-nums text-muted">
                            {result.finishTime}
                          </span>
                          <span className="font-semibold tabular-nums text-foreground">
                            {result.points}
                          </span>
                          <span className="text-muted">
                            {result.counted ? "в зачёте" : "резерв"}
                          </span>
                        </div>
                      ))}
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

export function LeaderboardBoard({
  maleRows,
  femaleRows,
}: {
  maleRows: PublicLeaderboardRow[];
  femaleRows: PublicLeaderboardRow[];
}) {
  const [mobileGender, setMobileGender] = useState<"male" | "female">("male");

  return (
    <>
      <div className="grid grid-cols-2 border border-border md:hidden">
        <button
          className={`min-h-11 px-4 text-sm font-semibold ${
            mobileGender === "male"
              ? "bg-accent text-white"
              : "bg-white text-foreground"
          }`}
          onClick={() => setMobileGender("male")}
          type="button"
        >
          Мужчины
        </button>
        <button
          className={`min-h-11 px-4 text-sm font-semibold ${
            mobileGender === "female"
              ? "bg-accent text-white"
              : "bg-white text-foreground"
          }`}
          onClick={() => setMobileGender("female")}
          type="button"
        >
          Женщины
        </button>
      </div>

      <div className="md:hidden">
        <LeaderboardColumn
          rows={mobileGender === "male" ? maleRows : femaleRows}
          title={mobileGender === "male" ? "Мужчины" : "Женщины"}
        />
      </div>

      <div className="hidden gap-5 md:grid md:grid-cols-2">
        <LeaderboardColumn rows={maleRows} title="Мужчины" />
        <LeaderboardColumn rows={femaleRows} title="Женщины" />
      </div>
    </>
  );
}
