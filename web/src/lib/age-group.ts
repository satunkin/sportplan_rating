import { Gender } from "@prisma/client";

export const CYCLON_SEASON_YEAR = 2026;

export function getSeasonAge(birthDate: Date, seasonYear = CYCLON_SEASON_YEAR) {
  const seasonEnd = new Date(Date.UTC(seasonYear, 11, 31));
  let age = seasonYear - birthDate.getUTCFullYear();

  if (
    seasonEnd.getUTCMonth() < birthDate.getUTCMonth() ||
    (seasonEnd.getUTCMonth() === birthDate.getUTCMonth() &&
      seasonEnd.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export function getDefaultAgeGroup(
  birthDate: Date,
  gender: Gender,
  seasonYear = CYCLON_SEASON_YEAR,
) {
  const age = getSeasonAge(birthDate, seasonYear);
  const prefix = gender === Gender.MALE ? "M" : "W";

  if (age < 18) return `${prefix}U18`;
  if (age < 25) return `${prefix}18-24`;

  const lower = Math.floor(age / 5) * 5;
  return `${prefix}${lower}-${lower + 4}`;
}
