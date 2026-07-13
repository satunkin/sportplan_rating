import { ArrowRight, CheckCircle, Clock, PencilSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const moderationItems = [
  { athlete: "Петров Дмитрий", event: "Кубок открытой воды", result: "42:18", type: "Новый результат", tone: "blue" },
  { athlete: "Смирнова Анна", event: "Cyclone Triathlon", result: "2:11:04", type: "Исправление", tone: "amber" },
  { athlete: "Морозов Евгений", event: "Весенний полумарафон", result: "1:28:37", type: "Удаление", tone: "red" },
  { athlete: "Кузнецова Елена", event: "Ironstar 70.3", result: "5:07:21", type: "Новый результат", tone: "blue" },
  { athlete: "Лебедев Артём", event: "Ночной забег", result: "39:54", type: "Исправление", tone: "amber" },
] as const;

const toneClasses = {
  blue: "bg-blue-50 text-accent",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
};

export function DemoCabinetPreview() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-8 sm:px-6 xl:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Кабинет администратора</p>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">DEMO · только просмотр</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Обзор сезона</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Изолированный preview: действия отключены, Supabase не используется.</p>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-strong" href="/leaderboard">Открыть рейтинг <ArrowRight size={17} /></Link>
        </header>

        <section aria-label="Сводка" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Спортсменов" value="120" detail="60 мужчин · 60 женщин" />
          <SummaryCard label="Соревнований" value="12" detail="20 дистанций" />
          <SummaryCard label="Результатов" value="420" detail="360 в рейтинге" />
          <SummaryCard label="На проверке" value="5" detail="2 требуют внимания" warning />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div><h2 className="text-lg font-bold">Очередь модерации</h2><p className="mt-1 text-xs text-muted">Новые заявки, исправления и удаления</p></div>
              <Clock className="text-muted" size={22} />
            </div>
            <div className="divide-y divide-border">
              {moderationItems.map((item) => (
                <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_120px_110px] sm:items-center" key={`${item.athlete}-${item.type}`}>
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{item.athlete}</p><p className="mt-1 truncate text-xs text-muted">{item.event}</p></div>
                  <div><p className="text-sm font-bold tabular-nums">{item.result}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${toneClasses[item.tone]}`}>{item.type}</span></div>
                  <div className="flex gap-2 sm:justify-end">
                    <button aria-label={`Просмотреть: ${item.athlete}`} className="grid size-9 place-items-center rounded-lg border border-border text-muted" disabled type="button"><PencilSimple size={16} /></button>
                    {item.type === "Удаление" ? <button aria-label={`Удаление: ${item.athlete}`} className="grid size-9 place-items-center rounded-lg border border-red-200 text-red-600" disabled type="button"><Trash size={16} /></button> : <button aria-label={`Подтвердить: ${item.athlete}`} className="grid size-9 place-items-center rounded-lg border border-emerald-200 text-emerald-600" disabled type="button"><CheckCircle size={16} /></button>}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="grid content-start gap-4">
            <DirectoryCard href="/events" title="Ближайшие старты" items={["Кубок открытой воды · 19 июля", "Триатлон на Урале · 2 августа", "Столица 10K · 16 августа"]} />
            <DirectoryCard href="/leaderboard" title="Состояние данных" items={["8 клубов", "12 тренеров", "9 возрастных групп"]} />
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) {
  return <article className="rounded-xl border border-border bg-white px-5 py-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p><p className={`mt-2 text-3xl font-bold ${warning ? "text-amber-700" : "text-foreground"}`}>{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></article>;
}

function DirectoryCard({ href, title, items }: { href: string; title: string; items: string[] }) {
  return <article className="rounded-xl border border-border bg-white px-5 py-5"><div className="flex items-center justify-between"><h2 className="font-bold">{title}</h2><Link aria-label={`Открыть: ${title}`} className="text-accent" href={href}><ArrowRight size={18} /></Link></div><ul className="mt-4 grid gap-3 text-sm text-muted">{items.map((item) => <li className="border-t border-border pt-3 first:border-0 first:pt-0" key={item}>{item}</li>)}</ul></article>;
}
