import Link from "next/link";
import { notFound } from "next/navigation";

import { ScoreBreakdown } from "@/components/score-breakdown";
import { getPublicAthleteProfile } from "@/lib/db";
import { isCountedTowardTopThree } from "@/lib/ranking";
import { formatDate } from "@/lib/time";

export default async function AthletePublicPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  const entry = await getPublicAthleteProfile(athleteId);

  if (!entry) {
    notFound();
  }

  const displayName =
    entry.athlete.publicDisplayName?.trim() ||
    `${entry.athlete.firstName} ${entry.athlete.lastName}`.trim();

  return (
    <main className="page-shell min-h-screen px-6 py-10 sm:px-10 lg:px-12">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Карточка спортсмена
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-accent-strong">
            {displayName}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Публичный профиль участника рейтинга: текущее место, очки сезона и, при разрешении спортсмена, все подтвержденные результаты.
          </p>

          <dl className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Место</dt>
              <dd className="mt-2 text-3xl font-semibold text-accent-strong">{entry.rank ?? "—"}</dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Очки</dt>
              <dd className="mt-2 text-3xl font-semibold text-accent-strong">
                {entry.totalPoints}
              </dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Город</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {entry.athlete.city ?? "—"}
              </dd>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-white/70 px-5 py-4">
              <dt className="text-sm uppercase tracking-[0.18em] text-muted">Возрастная группа</dt>
              <dd className="mt-2 text-lg font-semibold text-accent-strong">
                {entry.athlete.seasonAgeGroup ?? "—"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[2rem] bg-accent px-7 py-8 text-white shadow-[0_24px_90px_rgba(19,58,86,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            Лучшие старты
          </p>
          <div className="mt-6 grid gap-4">
            {entry.athlete.verifiedResults.slice(0, 3).map((result) => (
              <div key={result.id} className="rounded-[1.5rem] border border-white/15 bg-white/8 px-5 py-5">
                <p className="text-lg font-semibold">{result.submission.eventNameRaw}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {result.submission.distanceLabel} • {result.submission.finishTimeRaw}
                </p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  {result.awardedPoints} pts • {formatDate(result.submission.eventDate)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl rounded-[2rem] border border-border bg-surface px-7 py-8 shadow-[0_24px_70px_rgba(31,95,139,0.08)]">
        <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Результаты спортсмена
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-accent-strong">
              История подтвержденных стартов
            </h2>
          </div>
          <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" href="/leaderboard">
            Вернуться к рейтингу
          </Link>
        </div>

        {!entry.athlete.showPublicResults ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border bg-white/70 px-6 py-8 text-sm leading-7 text-muted">
            Спортсмен оставил результаты закрытыми для публичного просмотра. На странице видны только текущий рейтинг и основные данные профиля.
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {entry.athlete.verifiedResults.map((result, index) => (
              <article key={result.id} className="rounded-[1.5rem] border border-border bg-white/75 px-5 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-muted">
                      {result.submission.discipline} • {result.submission.distanceLabel}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-accent-strong">
                      {result.submission.eventNameRaw}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {formatDate(result.submission.eventDate)} • Время: {result.submission.finishTimeRaw}
                      {result.submission.placementOverall
                        ? ` • ${result.submission.placementOverall} абс.`
                        : ""}
                      {result.submission.placementInAgeGroup
                        ? ` • ${result.submission.placementInAgeGroup} в группе`
                        : ""}
                    </p>
                  </div>
                  <div
                    className={`rounded-[1.25rem] px-4 py-3 text-right ${
                      isCountedTowardTopThree(index)
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.18em]">
                      {isCountedTowardTopThree(index) ? "В зачете" : "Резерв"}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{result.awardedPoints}</p>
                  </div>
                </div>
                <ScoreBreakdown
                  ageGroupUsed={result.ageGroupUsed}
                  awardedPoints={result.awardedPoints}
                  basePoints={result.scoreRule.basePoints}
                  fifthPlaceTimeSeconds={result.fifthPlaceTimeSeconds}
                  lagPercent={result.lagPercent.toString()}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
