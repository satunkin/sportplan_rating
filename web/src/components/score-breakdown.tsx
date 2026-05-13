import { formatDurationFromSeconds } from "@/lib/time";

type ScoreBreakdownProps = {
  awardedPoints: number;
  basePoints: number;
  lagPercent: number | string;
  fifthPlaceTimeSeconds: number;
  ageGroupUsed: string;
  compact?: boolean;
};

function formatLagPercent(value: number | string) {
  return `${Number(value).toFixed(2)}%`;
}

export function ScoreBreakdown({
  awardedPoints,
  basePoints,
  lagPercent,
  fifthPlaceTimeSeconds,
  ageGroupUsed,
  compact = false,
}: ScoreBreakdownProps) {
  if (compact) {
    return (
      <div className="mt-2 rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm leading-6 text-muted">
        <p>
          {awardedPoints} pts из базы {basePoints} • лаг {formatLagPercent(lagPercent)}
        </p>
        <p>
          Эталон: 5-е место в группе {ageGroupUsed} за{" "}
          {formatDurationFromSeconds(fifthPlaceTimeSeconds)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <p className="uppercase tracking-[0.16em]">База категории</p>
        <p className="mt-1 text-base font-semibold text-accent-strong">
          {basePoints} pts
        </p>
      </div>
      <div>
        <p className="uppercase tracking-[0.16em]">Эталон группы</p>
        <p className="mt-1 text-base font-semibold text-accent-strong">
          {formatDurationFromSeconds(fifthPlaceTimeSeconds)}
        </p>
        <p className="text-xs">5-е место, {ageGroupUsed}</p>
      </div>
      <div>
        <p className="uppercase tracking-[0.16em]">Отставание</p>
        <p className="mt-1 text-base font-semibold text-accent-strong">
          {formatLagPercent(lagPercent)}
        </p>
      </div>
      <div>
        <p className="uppercase tracking-[0.16em]">Начислено</p>
        <p className="mt-1 text-base font-semibold text-accent-strong">
          {awardedPoints} pts
        </p>
      </div>
    </div>
  );
}
