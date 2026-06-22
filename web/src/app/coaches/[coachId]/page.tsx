import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicCoachCard } from "@/lib/cyclon-service";

export const dynamic = "force-dynamic";

export default async function CoachPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  const coach = await getPublicCoachCard(coachId);

  if (!coach) notFound();

  const athletes = coach.athletes
    .map(({ athlete }) => ({
      id: athlete.id,
      name:
        athlete.publicDisplayName?.trim() ||
        `${athlete.firstName} ${athlete.lastName}`.trim(),
      ranking: athlete.rankingEntries[0] ?? null,
    }))
    .sort((left, right) => (left.ranking?.rank ?? 9999) - (right.ranking?.rank ?? 9999));

  return (
    <main className="page-shell min-h-screen">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 sm:px-8">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold text-accent">Тренер</p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">{coach.name}</h1>
        </header>

        <section className="border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-2xl font-medium text-foreground">
              Атлеты в рейтинге 2026
            </h2>
          </div>
          <div className="divide-y divide-border">
            {athletes.map((athlete) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_80px_90px] gap-3 px-5 py-4"
                key={athlete.id}
              >
                <span className="font-semibold text-foreground">{athlete.name}</span>
                <span className="text-sm text-muted">
                  место {athlete.ranking?.rank ?? "—"}
                </span>
                <span className="text-right font-semibold tabular-nums text-foreground">
                  {athlete.ranking?.totalPoints ?? 0}
                </span>
              </div>
            ))}
            {!athletes.length ? (
              <p className="px-5 py-8 text-sm text-muted">
                В текущем рейтинге пока нет связанных атлетов.
              </p>
            ) : null}
          </div>
        </section>

        <Link className="font-semibold text-accent" href={`/leaderboard?coach=${coach.id}`}>
          Показать в полном рейтинге
        </Link>
      </section>
    </main>
  );
}
