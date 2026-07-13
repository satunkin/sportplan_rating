"use client";

import { MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const urlQuery = searchParams.get("q") ?? "";
  const [queryState, setQueryState] = useState({ urlQuery, value: urlQuery });
  const query = queryState.urlQuery === urlQuery ? queryState.value : urlQuery;
  const active = ["q", "ageGroup", "club", "coach"].some((key) =>
    Boolean(searchParams.get(key)),
  );

  const updateParams = useCallback(
    (nextValues: { q?: string; ageGroup?: string; club?: string; coach?: string }) => {
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
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (query === urlQuery) return;
    const timeout = window.setTimeout(() => updateParams({ q: query }), 250);
    return () => window.clearTimeout(timeout);
  }, [query, updateParams, urlQuery]);

  const resetFilters = () => {
    setQueryState({ urlQuery, value: "" });
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  const fields = (
    <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
      <label className="grid gap-1.5 text-xs font-semibold text-muted">
        Поиск спортсмена
        <span className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
          <input
            className="min-h-11 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm font-normal text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
            name="q"
            onChange={(event) => setQueryState({ urlQuery, value: event.target.value })}
            placeholder="Имя или фамилия"
            value={query}
          />
        </span>
      </label>
      <FilterSelect label="Возрастная группа" name="ageGroup" onChange={updateParams} value={searchParams.get("ageGroup") ?? ""}>
        <option value="">Все группы</option>
        {ageGroups.map((group) => <option key={group} value={group}>{group}</option>)}
      </FilterSelect>
      <FilterSelect label="Клуб" name="club" onChange={updateParams} value={searchParams.get("club") ?? ""}>
        <option value="">Все клубы</option>
        {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
      </FilterSelect>
      <FilterSelect label="Тренер" name="coach" onChange={updateParams} value={searchParams.get("coach") ?? ""}>
        <option value="">Все тренеры</option>
        {coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
      </FilterSelect>
      {active ? (
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold hover:bg-surface-strong disabled:opacity-60" disabled={isPending} onClick={resetFilters} type="button">
          <X size={16} /> Сбросить фильтры
        </button>
      ) : null}
    </form>
  );

  return (
    <>
      <aside className="fixed bottom-16 left-0 top-[278px] z-30 hidden w-56 overflow-y-auto border-t border-border bg-white px-4 py-5 lg:block">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={18} /> Фильтры</div>
        {fields}
      </aside>
      <div className="lg:hidden">
        <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold" onClick={() => setMobileOpen((value) => !value)} type="button">
          <SlidersHorizontal size={18} /> {mobileOpen ? "Скрыть фильтры" : "Фильтры"}{active ? " · выбраны" : ""}
        </button>
        {mobileOpen ? <div className="mt-3 rounded-xl border border-border bg-surface px-4 py-4">{fields}</div> : null}
      </div>
    </>
  );
}

function FilterSelect({ label, name, value, onChange, children }: {
  label: string;
  name: "ageGroup" | "club" | "coach";
  value: string;
  onChange: (values: { ageGroup?: string; club?: string; coach?: string }) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-muted">
      {label}
      <select className="min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" name={name} onChange={(event) => onChange({ [name]: event.target.value })} value={value}>
        {children}
      </select>
    </label>
  );
}
