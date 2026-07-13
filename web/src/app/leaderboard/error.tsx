"use client";

export default function LeaderboardError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-[65vh] place-items-center px-4 py-10">
      <section className="max-w-md rounded-xl border border-border bg-white px-6 py-8 text-center">
        <h1 className="text-xl font-bold">Не удалось загрузить рейтинг</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Проверьте соединение и попробуйте ещё раз. Данные в базе не изменены.</p>
        <button className="mt-5 min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-white" onClick={reset} type="button">Повторить</button>
      </section>
    </main>
  );
}
