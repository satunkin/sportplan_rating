"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

type DirectoryOption = {
  id: string;
  name: string;
};

const FILTER_KEYS = ["q", "ageGroup", "club", "coach"] as const;
const PAGE_KEYS = ["malePage", "femalePage"] as const;

export function LeaderboardFilterForm({
  ageGroups,
  clubs,
  coaches,
}: {
  ageGroups: string[];
  clubs: DirectoryOption[];
  coaches: DirectoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeFilters = useMemo(
    () => FILTER_KEYS.some((key) => Boolean(searchParams.get(key))),
    [searchParams],
  );

  const updateFilters = useCallback(
    (nextFilters: Partial<Record<(typeof FILTER_KEYS)[number], string>>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(nextFilters)) {
        const normalizedValue = value?.trim() ?? "";

        if (normalizedValue) params.set(key, normalizedValue);
        else params.delete(key);
      }

      for (const key of PAGE_KEYS) {
        params.delete(key);
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) {
        updateFilters({ q: query });
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query, searchParams, updateFilters]);

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    for (const key of [...FILTER_KEYS, ...PAGE_KEYS]) {
      params.delete(key);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    setQuery("");

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  return (
    <form
      className="grid gap-2 rounded-lg border border-border bg-surface px-3 py-3 md:grid-cols-[minmax(160px,1.35fr)_repeat(3,minmax(130px,1fr))_auto]"
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        aria-label="Имя атлета"
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="q"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Имя атлета"
        value={query}
      />
      <select
        aria-label="Возрастная группа"
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="ageGroup"
        onChange={(event) => updateFilters({ ageGroup: event.target.value })}
        value={searchParams.get("ageGroup") ?? ""}
      >
        <option value="">Все группы</option>
        {ageGroups.map((ageGroup) => (
          <option key={ageGroup} value={ageGroup}>
            {ageGroup}
          </option>
        ))}
      </select>
      <select
        aria-label="Клуб"
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="club"
        onChange={(event) => updateFilters({ club: event.target.value })}
        value={searchParams.get("club") ?? ""}
      >
        <option value="">Все клубы</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Тренер"
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="coach"
        onChange={(event) => updateFilters({ coach: event.target.value })}
        value={searchParams.get("coach") ?? ""}
      >
        <option value="">Все тренеры</option>
        {coaches.map((coach) => (
          <option key={coach.id} value={coach.id}>
            {coach.name}
          </option>
        ))}
      </select>
      <div className="flex min-h-10 items-center justify-end">
        {activeFilters ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:opacity-70"
            disabled={isPending}
            onClick={resetFilters}
            type="button"
          >
            {isPending ? "Обновляем..." : "Сбросить"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
