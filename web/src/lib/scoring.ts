import { Discipline } from "@prisma/client";

export const SCORE_RULES = [
  { discipline: Discipline.RUNNING, categoryKey: "run_5k", label: "5 км", basePoints: 500 },
  { discipline: Discipline.RUNNING, categoryKey: "run_10k", label: "10 км", basePoints: 600 },
  { discipline: Discipline.RUNNING, categoryKey: "run_21k", label: "21 км", basePoints: 800 },
  { discipline: Discipline.RUNNING, categoryKey: "run_marathon", label: "Марафон", basePoints: 1000 },
  { discipline: Discipline.RUNNING, categoryKey: "run_hard", label: "Hard Marathon", basePoints: 1100 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_sprint", label: "Спринт", basePoints: 500 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_olympic", label: "Олимпийка", basePoints: 600 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_half", label: "Half Ironman", basePoints: 800 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_full", label: "Ironman", basePoints: 1000 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_hard", label: "Hard Ironman", basePoints: 1100 },
  { discipline: Discipline.SWIMMING, categoryKey: "swim_short", label: "Короткая вода", basePoints: 500 },
  { discipline: Discipline.SWIMMING, categoryKey: "swim_mid", label: "Средняя вода", basePoints: 700 },
  { discipline: Discipline.SWIMMING, categoryKey: "swim_long", label: "Длинная вода", basePoints: 900 },
  { discipline: Discipline.CYCLING, categoryKey: "bike_short", label: "Короткая велогонка", basePoints: 500 },
  { discipline: Discipline.CYCLING, categoryKey: "bike_mid", label: "Средняя велогонка", basePoints: 700 },
  { discipline: Discipline.CYCLING, categoryKey: "bike_long", label: "Веломарафон", basePoints: 900 },
  { discipline: Discipline.CYCLING, categoryKey: "bike_ultra", label: "Ультра-вело", basePoints: 1100 },
] as const;

export function getDisciplineCategories(discipline: Discipline) {
  return SCORE_RULES.filter((rule) => rule.discipline === discipline);
}

export function calculateLagPercent(
  athleteFinishSeconds: number,
  fifthPlaceSeconds: number,
) {
  if (fifthPlaceSeconds <= 0) {
    throw new Error("INVALID_FIFTH_PLACE_TIME");
  }

  const rawLag =
    ((athleteFinishSeconds - fifthPlaceSeconds) / fifthPlaceSeconds) * 100;

  return Math.max(0, Number(rawLag.toFixed(2)));
}

export function calculatePoints(basePoints: number, lagPercent: number) {
  return Math.max(0, Math.round(basePoints * Math.exp(-0.077 * lagPercent)));
}
