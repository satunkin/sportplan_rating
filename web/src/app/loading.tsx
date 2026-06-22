export default function Loading() {
  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section
        aria-busy="true"
        aria-label="Загрузка страницы"
        className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-6"
      >
        <div className="border-b border-border pb-6">
          <div className="h-4 w-32 rounded bg-surface-strong" />
          <div className="mt-4 h-10 w-full max-w-xl rounded bg-surface-strong" />
          <div className="mt-4 h-5 w-full max-w-2xl rounded bg-surface-strong" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              className="h-24 rounded-lg border border-border bg-surface"
              key={item}
            />
          ))}
        </div>
        <div className="h-80 rounded-lg border border-border bg-surface" />
      </section>
    </main>
  );
}
