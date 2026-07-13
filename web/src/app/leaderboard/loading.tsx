export default function LeaderboardLoading() {
  return (
    <main aria-busy="true" aria-label="Загрузка рейтинга" className="min-h-screen bg-[#f7f8fa] px-4 py-8 sm:px-6 xl:px-10">
      <div className="mx-auto grid w-full max-w-5xl animate-pulse gap-5">
        <div className="h-28 rounded-xl bg-surface-strong" />
        <div className="h-11 rounded-lg bg-surface-strong lg:hidden" />
        <div className="h-80 rounded-xl border border-border bg-white" />
        <div className="h-80 rounded-xl border border-border bg-white" />
      </div>
    </main>
  );
}
