import { Discipline, EntityStatus } from "@prisma/client";

import type { PublicLeaderboardRow } from "@/lib/public-data-types";
import { calculateResultPoints, SCORE_RULES } from "@/lib/scoring";

const DEMO_NOW = new Date("2026-07-13T09:30:00.000Z");

const maleFirstNames = [
  "Алексей", "Дмитрий", "Игорь", "Максим", "Сергей", "Андрей", "Артём",
  "Евгений", "Роман", "Павел", "Михаил", "Николай", "Виктор", "Антон",
  "Владимир", "Александр-Константин", "Денис", "Олег", "Илья", "Георгий",
];
const femaleFirstNames = [
  "Анна", "Ольга", "Елена", "Дарья", "Наталья", "Мария", "Светлана",
  "Ирина", "Юлия", "Татьяна", "Екатерина", "Марина", "Алина", "Полина",
  "Виктория", "Ксения", "Анастасия", "Людмила", "Надежда", "Софья",
];
const maleLastNames = [
  "Иванов", "Петров", "Смирнов", "Кузнецов", "Волков", "Соколов", "Лебедев",
  "Морозов", "Козлов", "Зайцев", "Семёнов", "Никитин", "Орлов", "Макаров",
  "Захаров", "Белов", "Громов", "Фёдоров", "Васильев", "Северцев-Заречный",
];
const femaleLastNames = [
  "Смирнова", "Васильева", "Кузнецова", "Павлова", "Тихонова", "Громова",
  "Лунева", "Егорова", "Соколова", "Морозова", "Волкова", "Орлова",
  "Лебедева", "Новикова", "Фёдорова", "Беляева", "Романова", "Кавалерова-Петровская",
  "Захарова", "Крылова",
];

const ageBands = [
  "18-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64",
];

const cities = [
  "Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Сочи", "Самара",
  "Нижний Новгород", "Ярославль",
];

export const demoClubs = [
  "Cyclone Team", "TriClub", "WakeRun", "SportHub", "SwimRun Club", "Enduro Lab",
  "Tempo Team", "Northern Pace",
].map((name, index) => ({ id: `demo-club-${index + 1}`, name }));

export const demoCoaches = [
  "Соколов Михаил", "Кузнецова Анна", "Волков Илья", "Егоров Константин",
  "Петров Дмитрий", "Киселёв Роман", "Фомина Ирина", "Серов Алексей",
  "Орлова Марина", "Белов Андрей", "Громова Ольга", "Лебедев Виктор",
].map((name, index) => ({ id: `demo-coach-${index + 1}`, name }));

const competitionSpecs = [
  ["Зимний забег", "2026-02-15", "Москва"],
  ["Весенний полумарафон", "2026-04-12", "Санкт-Петербург"],
  ["Cyclone Triathlon", "2026-05-17", "Сочи"],
  ["Ironstar 70.3", "2026-06-21", "Казань"],
  ["Веломарафон Волга", "2026-06-28", "Самара"],
  ["Ночной забег", "2026-07-05", "Москва"],
  ["Кубок открытой воды", "2026-07-19", "Ярославль"],
  ["Триатлон на Урале", "2026-08-02", "Екатеринбург"],
  ["Столица 10K", "2026-08-16", "Москва"],
  ["Gran Fondo", "2026-09-06", "Нижний Новгород"],
  ["Осенний марафон", "2026-09-20", "Казань"],
  ["Финал Кубка Циклон", "2026-10-04", "Сочи"],
] as const;

const distanceCycle = [
  { discipline: Discipline.RUNNING, distanceLabel: "10 км" },
  { discipline: Discipline.RUNNING, distanceLabel: "21,1 км" },
  { discipline: Discipline.TRIATHLON, distanceLabel: "Олимпийская" },
  { discipline: Discipline.TRIATHLON, distanceLabel: "70.3" },
  { discipline: Discipline.CYCLING, distanceLabel: "100 км" },
  { discipline: Discipline.SWIMMING, distanceLabel: "3 км" },
] as const;

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

export const demoCompetitions = competitionSpecs.map(([name, date, city], index) => {
  const distanceCount = index < 8 ? 2 : 1;
  const distances = Array.from({ length: distanceCount }, (_, distanceIndex) => {
    const spec = distanceCycle[(index + distanceIndex) % distanceCycle.length];
    return {
      id: `demo-distance-${index + 1}-${distanceIndex + 1}`,
      competitionId: `demo-competition-${index + 1}`,
      name: `${name} · ${spec.distanceLabel}`,
      eventDate: new Date(`${date}T08:00:00.000Z`),
      discipline: spec.discipline,
      distanceLabel: spec.distanceLabel,
      sourceUrl: "https://example.com/demo-protocol",
      location: city,
      categoryId: null,
      status: EntityStatus.ACTIVE,
      archivedAt: null,
      createdAt: DEMO_NOW,
      updatedAt: DEMO_NOW,
    };
  });

  return {
    id: `demo-competition-${index + 1}`,
    name,
    eventDate: new Date(`${date}T08:00:00.000Z`),
    city,
    pageUrl: "https://example.com/demo-event",
    registrationUrl: index >= 6 ? "https://example.com/demo-registration" : null,
    resultsUrl: index < 6 ? "https://example.com/demo-results" : null,
    seriesId: null,
    status: EntityStatus.ACTIVE,
    archivedAt: null,
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
    series: null,
    distances,
    isPast: new Date(`${date}T08:00:00.000Z`) < DEMO_NOW,
    participantsCount: index < 6 ? 28 + index * 7 : 0,
    protocolRowsCount: index < 6 ? 180 + index * 93 : 0,
  };
});

function createAthleteRows(gender: "MALE" | "FEMALE") {
  const firstNames = gender === "MALE" ? maleFirstNames : femaleFirstNames;
  const lastNames = gender === "MALE" ? maleLastNames : femaleLastNames;
  const prefix = gender === "MALE" ? "M" : "W";

  const rows = Array.from({ length: 60 }, (_, index) => {
    const resultCount = (index % 6) + 1;
    const ageBand = ageBands[(index * 2 + Math.floor(index / 7)) % ageBands.length];
    const results = Array.from({ length: resultCount }, (_, resultIndex) => {
      const rule = SCORE_RULES[(index * 3 + resultIndex * 5) % SCORE_RULES.length];
      const lagPercent = ((index * 7 + resultIndex * 11) % 23) + (resultIndex % 2) * 0.35;
      const ageGroupPlacement = ((index + resultIndex * 3) % 18) + 1;
      const groupFinishersCount = 5 + ((index + resultIndex * 2) % 12);
      const fifthPlaceSeconds = 11_000;
      const points = calculateResultPoints({
        basePoints: rule.basePoints,
        athleteFinishSeconds: Math.round(fifthPlaceSeconds * (1 + lagPercent / 100)),
        firstPlaceSeconds: 10_000,
        fifthPlaceSeconds,
        groupFinishersCount,
        placementInAgeGroup: ageGroupPlacement,
      }).awardedPoints;
      const competition = demoCompetitions[(index + resultIndex * 2) % 6];
      const distance = competition.distances[resultIndex % competition.distances.length];
      const baseSeconds = 2100 + ((index * 317 + resultIndex * 643) % 12500);

      return {
        id: `demo-result-${gender.toLowerCase()}-${index + 1}-${resultIndex + 1}`,
        competitionId: competition.id,
        eventName: competition.name,
        distanceLabel: distance.distanceLabel,
        finishTime: formatDuration(baseSeconds),
        ageGroupPlacement,
        points,
        counted: false,
      };
    }).sort((left, right) => right.points - left.points);

    results.forEach((result, resultIndex) => {
      result.counted = resultIndex < 3;
    });

    return {
      id: `demo-athlete-${gender.toLowerCase()}-${index + 1}`,
      rank: 0,
      totalPoints: results.slice(0, 3).reduce((sum, result) => sum + result.points, 0),
      scoredResultsCount: results.length,
      gender,
      ageGroup: `${prefix}${ageBand}`,
      athleteName: `${lastNames[index % lastNames.length]} ${firstNames[(index * 7) % firstNames.length]}`,
      telegramUsername: index % 5 === 0 ? `cyclon_demo_${gender.toLowerCase()}_${index + 1}` : null,
      clubs: index % 7 === 0 ? [] : [demoClubs[index % demoClubs.length]],
      coaches: index % 6 === 0 ? [] : [demoCoaches[(index * 3) % demoCoaches.length]],
      results,
      city: cities[index % cities.length],
    } satisfies PublicLeaderboardRow & { city: string };
  });

  rows.sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) return right.totalPoints - left.totalPoints;
    const leftScores = left.results.slice(0, 3).map((result) => result.points);
    const rightScores = right.results.slice(0, 3).map((result) => result.points);
    for (let index = 0; index < 3; index += 1) {
      if ((rightScores[index] ?? 0) !== (leftScores[index] ?? 0)) {
        return (rightScores[index] ?? 0) - (leftScores[index] ?? 0);
      }
    }
    return left.athleteName.localeCompare(right.athleteName, "ru");
  });

  let previousSignature = "";
  let previousRank = 0;
  rows.forEach((row, index) => {
    const signature = `${row.totalPoints}:${row.results.slice(0, 3).map((result) => result.points).join(":")}`;
    row.rank = signature === previousSignature ? previousRank : index + 1;
    previousSignature = signature;
    previousRank = row.rank;
  });

  return rows;
}

export const demoLeaderboardRows: PublicLeaderboardRow[] = [
  ...createAthleteRows("MALE"),
  ...createAthleteRows("FEMALE"),
];

export function getDemoLeaderboardDirectoryOptions() {
  return {
    clubs: demoClubs,
    coaches: demoCoaches,
    ageGroups: ageBands,
  };
}

export function listDemoCompetitions(filters?: { discipline?: string }) {
  if (!filters?.discipline || filters.discipline === "all") return demoCompetitions;
  return demoCompetitions
    .map((competition) => ({
      ...competition,
      distances: competition.distances.filter(
        (distance) => distance.discipline === filters.discipline,
      ),
    }))
    .filter((competition) => competition.distances.length > 0);
}

export function getDemoCompetition(competitionId: string) {
  const competition = demoCompetitions.find((item) => item.id === competitionId);
  if (!competition) return null;

  return {
    ...competition,
    distances: competition.distances.map((distance, distanceIndex) => {
      const participants = demoLeaderboardRows
        .flatMap((row) =>
          row.results
            .filter(
              (result) =>
                result.competitionId === competition.id &&
                result.distanceLabel === distance.distanceLabel,
            )
            .map((result) => ({
              id: result.id,
              athleteName: row.athleteName,
              finishTime: result.finishTime,
              ageGroup: row.ageGroup ?? "—",
              points: result.points,
              placementOverall: row.rank,
              placementInAgeGroup: result.ageGroupPlacement,
            })),
        )
        .slice(0, 24);

      return {
        ...distance,
        category: null,
        _count: { protocolRows: 180 + distanceIndex * 70 },
        protocolGroups: (["MALE", "FEMALE"] as const).flatMap(
          (gender, genderIndex) =>
            ageBands.slice(0, 6).map((band, groupIndex) => {
              const finishersCount = groupIndex < 2 ? groupIndex + 2 : 8 + groupIndex;
              const prefix = gender === "MALE" ? "М" : "Ж";
              const timeOffset = genderIndex * 420 + groupIndex * 180;

              return {
                id: `${distance.id}-group-${gender.toLowerCase()}-${groupIndex + 1}`,
                eventId: distance.id,
                groupKey: `${prefix} ${band}`,
                label: `${prefix} ${band}`,
                gender,
                minAge: null,
                maxAge: null,
                firstPlaceTimeSeconds: 2100 + timeOffset,
                fifthPlaceTimeSeconds:
                  finishersCount < 5 ? null : 2300 + timeOffset,
                finishersCount,
                benchmarkSource:
                  finishersCount < 5 ? null : ("PROTOCOL" as const),
                benchmarkNotes: null,
                createdAt: DEMO_NOW,
                updatedAt: DEMO_NOW,
              };
            }),
        ),
        participants,
      };
    }),
  };
}

function getDemoDirectoryCard(entityId: string, type: "club" | "coach") {
  const directory = type === "club" ? demoClubs : demoCoaches;
  const entity = directory.find((item) => item.id === entityId);
  if (!entity) return null;

  const rows = demoLeaderboardRows
    .filter((row) =>
      type === "club"
        ? row.clubs.some((club) => club.id === entityId)
        : row.coaches.some((coach) => coach.id === entityId),
    )
    .slice(0, 20);

  return {
    id: entity.id,
    name: entity.name,
    websiteUrl: type === "club" ? "https://example.com/demo-club" : null,
    athletes: rows.map((row) => ({
      athlete: {
        id: row.id,
        firstName: row.athleteName.split(" ")[1] ?? row.athleteName,
        lastName: row.athleteName.split(" ")[0] ?? "",
        publicDisplayName: row.athleteName,
        rankingEntries: [
          {
            id: `ranking-${row.id}`,
            athleteId: row.id,
            seasonId: "demo-season-2026",
            rank: row.rank,
            totalPoints: row.totalPoints,
            scoredResultsCount: row.scoredResultsCount,
            snapshotAt: DEMO_NOW,
            createdAt: DEMO_NOW,
            updatedAt: DEMO_NOW,
          },
        ],
      },
    })),
  };
}

export function getDemoClubCard(clubId: string) {
  return getDemoDirectoryCard(clubId, "club");
}

export function getDemoCoachCard(coachId: string) {
  return getDemoDirectoryCard(coachId, "coach");
}
