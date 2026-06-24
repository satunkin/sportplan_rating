"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export function LeaderboardFilterForm({
  ageGroups,
  clubs,
  coaches,
}: {
  ageGroups: string[];
  clubs: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const urlQuery = searchParams.get("q") ?? "";
  const [queryState, setQueryState] = useState({
    urlQuery,
    value: urlQuery,
  });
  const query =
    queryState.urlQuery === urlQuery ? queryState.value : urlQuery;
  const active =
    Boolean(urlQuery) ||
    Boolean(searchParams.get("ageGroup")) ||
    Boolean(searchParams.get("club")) ||
    Boolean(searchParams.get("coach"));

  const updateParams = useCallback(
    (nextValues: {
      q?: string;
      ageGroup?: string;
      club?: string;
      coach?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      const keys = ["q", "ageGroup", "club", "coach"] as const;

      for (const key of keys) {
        if (!(key in nextValues)) continue;
        const value = nextValues[key]?.trim() ?? "";
        if (value) params.set(key, value);
        else params.delete(key);
      }

      params.delete("malePage");
      params.delete("femalePage");
      const queryString = params.toString();

      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (query === urlQuery) return;
    const timeout = window.setTimeout(() => {
      updateParams({ q: query });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, updateParams, urlQuery]);

  const resetFilters = () => {
    setQueryState({ urlQuery, value: "" });
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <form
      className="grid gap-2 rounded-xl border border-border bg-surface px-4 py-4 md:grid-cols-[minmax(170px,1.4fr)_repeat(3,minmax(130px,1fr))_auto]"
      onSubmit={(event) => event.preventDefault()}
    >
      <input
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="q"
        onChange={(event) =>
          setQueryState({ urlQuery, value: event.target.value })
        }
        placeholder="Имя атлета"
        value={query}
      />
      <select
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="ageGroup"
        onChange={(event) => updateParams({ ageGroup: event.target.value })}
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
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="club"
        onChange={(event) => updateParams({ club: event.target.value })}
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
        className="min-h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        name="coach"
        onChange={(event) => updateParams({ coach: event.target.value })}
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
        {active ? (
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:opacity-70"
            disabled={isPending}
            onClick={resetFilters}
            type="button"
          >
            Сбросить
          </button>
        ) : (
          <span className="hidden md:block" />
        )}
      </div>
    </form>
  );
}
