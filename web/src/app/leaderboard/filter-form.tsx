"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function LeaderboardFilterForm({
  ageGroups,
  disciplines,
}: {
  ageGroups: string[];
  disciplines: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onChange = (formData: FormData) => {
    const params = new URLSearchParams(searchParams.toString());
    const ageGroup = String(formData.get("ageGroup") ?? "all");
    const discipline = String(formData.get("discipline") ?? "all");

    if (ageGroup === "all") params.delete("ageGroup");
    else params.set("ageGroup", ageGroup);

    if (discipline === "all") params.delete("discipline");
    else params.set("discipline", discipline);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <form
      action={onChange}
      className="mt-6 grid gap-4 rounded-[1.5rem] border border-border bg-white/70 px-5 py-5 md:grid-cols-2"
    >
      <label className="text-sm font-medium text-foreground">
        Возрастная группа
        <select
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
          defaultValue={searchParams.get("ageGroup") ?? "all"}
          name="ageGroup"
        >
          <option value="all">Все группы</option>
          {ageGroups.map((ageGroup) => (
            <option key={ageGroup} value={ageGroup}>
              {ageGroup}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-foreground">
        Дисциплина
        <select
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-base outline-none transition focus:border-accent"
          defaultValue={searchParams.get("discipline") ?? "all"}
          name="discipline"
        >
          <option value="all">Все дисциплины</option>
          {disciplines.map((discipline) => (
            <option key={discipline} value={discipline}>
              {discipline}
            </option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2 flex items-center justify-between text-sm text-muted">
        <span>Фильтры применяются без перезагрузки страницы.</span>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 py-2 font-semibold text-white transition hover:bg-accent-strong disabled:opacity-70"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Обновляем..." : "Применить"}
        </button>
      </div>
    </form>
  );
}
