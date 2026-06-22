import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicClubCard } from "@/lib/cyclon-service";

export const dynamic = "force-dynamic";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getPublicClubCard(clubId);

  if (!club) notFound();

  const athletes = club.athletes
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
          <p className="text-sm font-semibold text-accent">Клуб</p>
          <h1 className="mt-2 text-4xl font-medium text-foreground">{club.name}</h1>
          {club.websiteUrl ? (
            <a
              className="mt-3 inline-flex font-semibold text-accent underline-offset-4 hover:underline"
              href={club.websiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              Сайт клуба
            </a>
          ) : null}
        </header>

        <section className="border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-2xl font-medium text-foreground">
              Участники рейтинга 2026
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
                В текущем рейтинге пока нет участников клуба.
              </p>
            ) : null}
          </div>
        </section>

        <Link className="font-semibold text-accent" href={`/leaderboard?club=${club.id}`}>
          Показать в полном рейтинге
        </Link>
      </section>
    </main>
  );
}
