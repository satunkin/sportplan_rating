import type { ReactNode } from "react";

export function TechnicalNote({
  title = "Техническая заметка для разработки",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="rounded-[1.5rem] border border-amber-300 bg-amber-50/90 px-5 py-5 shadow-[0_12px_35px_rgba(180,83,9,0.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-800">
        {title}
      </p>
      <div className="mt-3 text-sm leading-7 text-amber-900/88">{children}</div>
    </aside>
  );
}
