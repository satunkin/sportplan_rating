import { PrismaClient, Discipline, VerificationMode } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });
const currentYear = new Date().getFullYear();

const scoreRules = [
  { discipline: Discipline.RUNNING, categoryKey: "run_5k", label: "5 км", basePoints: 500 },
  { discipline: Discipline.RUNNING, categoryKey: "run_10k", label: "10 км", basePoints: 600 },
  { discipline: Discipline.RUNNING, categoryKey: "run_21k", label: "21 км", basePoints: 800 },
  { discipline: Discipline.RUNNING, categoryKey: "run_marathon", label: "Марафон", basePoints: 1000 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_sprint", label: "Спринт", basePoints: 500 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_olympic", label: "Олимпийка", basePoints: 600 },
  { discipline: Discipline.TRIATHLON, categoryKey: "tri_half", label: "Half Ironman", basePoints: 800 },
  { discipline: Discipline.SWIMMING, categoryKey: "swim_mid", label: "Средняя вода", basePoints: 700 },
  { discipline: Discipline.CYCLING, categoryKey: "bike_mid", label: "Средняя велогонка", basePoints: 700 },
];

const demoResults = [
  ["Алексей", "Волков", "Москва", "M35-39", "Весенний забег 10 км", Discipline.RUNNING, "10 км", "39:20", "38:30", "run_10k", "alexey.demo@cyclon.local"],
  ["Алексей", "Волков", "Москва", "M35-39", "Городской полумарафон", Discipline.RUNNING, "21 км", "01:28:20", "01:25:10", "run_21k", "alexey.demo@cyclon.local"],
  ["Марина", "Крылова", "Санкт-Петербург", "W30-34", "Open Water Cup", Discipline.SWIMMING, "3 км", "41:40", "39:50", "swim_mid", "marina.demo@cyclon.local"],
  ["Марина", "Крылова", "Санкт-Петербург", "W30-34", "Cyclon Tri Sprint", Discipline.TRIATHLON, "Спринт", "01:17:30", "01:13:40", "tri_sprint", "marina.demo@cyclon.local"],
  ["Илья", "Серов", "Казань", "M40-44", "Gran Fondo 90 км", Discipline.CYCLING, "90 км", "02:31:10", "02:24:20", "bike_mid", "ilya.demo@cyclon.local"],
  ["Илья", "Серов", "Казань", "M40-44", "Cyclon Olympic Triathlon", Discipline.TRIATHLON, "Олимпийка", "02:24:10", "02:18:00", "tri_olympic", "ilya.demo@cyclon.local"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Ночной забег 5 км", Discipline.RUNNING, "5 км", "21:45", "20:50", "run_5k", "anna.demo@cyclon.local"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Осенний марафон", Discipline.RUNNING, "Марафон", "03:26:15", "03:18:40", "run_marathon", "anna.demo@cyclon.local"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Cyclon Tri Half", Discipline.TRIATHLON, "Half Ironman", "05:14:30", "04:58:10", "tri_half", "anna.demo@cyclon.local"],
];

function parseTimeToSeconds(value) {
  const parts = value.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  throw new Error(`Bad time: ${value}`);
}

function calculatePoints(basePoints, athleteFinishSeconds, fifthPlaceSeconds) {
  const lagPercent = Math.max(
    0,
    ((athleteFinishSeconds - fifthPlaceSeconds) / fifthPlaceSeconds) * 100,
  );
  return {
    lagPercent: Number(lagPercent.toFixed(2)),
    points: Math.max(0, Math.round(basePoints * Math.exp(-0.077 * lagPercent))),
  };
}

async function main() {
  const season = await prisma.season.upsert({
    where: { name: `${currentYear} Season` },
    update: {},
    create: {
      name: `${currentYear} Season`,
      startDate: new Date(`${currentYear}-01-01T00:00:00.000Z`),
      endDate: new Date(`${currentYear}-12-31T23:59:59.000Z`),
      status: "ACTIVE",
    },
  });

  await prisma.auditLog.deleteMany();
  await prisma.manualReview.deleteMany();
  await prisma.verifiedResult.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.resultSubmission.deleteMany();
  await prisma.event.deleteMany();
  await prisma.scoreRule.deleteMany({ where: { seasonId: season.id } });
  await prisma.eventCategory.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.user.deleteMany();

  for (const rule of scoreRules) {
    const category = await prisma.eventCategory.create({
      data: {
        discipline: rule.discipline,
        categoryKey: rule.categoryKey,
        label: rule.label,
        basePointsDefault: rule.basePoints,
      },
    });

    await prisma.scoreRule.create({
      data: {
        id: `${season.id}:${rule.discipline}:${rule.categoryKey}`,
        seasonId: season.id,
        discipline: rule.discipline,
        categoryKey: rule.categoryKey,
        basePoints: rule.basePoints,
        eventCategoryId: category.id,
      },
    });
  }

  const athletes = new Map();

  for (const [firstName, lastName, city, ageGroup, , , , , , , email] of demoResults) {
    if (athletes.has(email)) continue;
    const user = await prisma.user.create({
      data: { email, role: "ATHLETE" },
    });
    const athlete = await prisma.athlete.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        birthDate: new Date("1990-01-01T00:00:00.000Z"),
        gender: ageGroup.startsWith("W") ? "FEMALE" : "MALE",
        city,
        seasonAgeGroup: ageGroup,
      },
    });
    athletes.set(email, athlete);
  }

  for (const row of demoResults) {
    const [
      ,
      ,
      ,
      ageGroup,
      eventName,
      discipline,
      distanceLabel,
      finishTime,
      fifthPlaceTime,
      categoryKey,
      email,
    ] = row;

    const athlete = athletes.get(email);
    const category = await prisma.eventCategory.findFirst({
      where: { discipline, categoryKey },
    });
    const rule = await prisma.scoreRule.findFirst({
      where: { seasonId: season.id, discipline, categoryKey },
    });

    const event = await prisma.event.create({
      data: {
        name: eventName,
        eventDate: new Date(`${currentYear}-05-01T09:00:00.000Z`),
        discipline,
        distanceLabel,
        categoryId: category.id,
      },
    });

    const submission = await prisma.resultSubmission.create({
      data: {
        athleteId: athlete.id,
        seasonId: season.id,
        eventId: event.id,
        eventNameRaw: eventName,
        eventDate: event.eventDate,
        discipline,
        distanceLabel,
        ageGroupClaimed: ageGroup,
        finishTimeRaw: finishTime,
        finishTimeSeconds: parseTimeToSeconds(finishTime),
        protocolUrl: "https://example.com/demo",
        status: "VERIFIED",
      },
    });

    const { lagPercent, points } = calculatePoints(
      rule.basePoints,
      parseTimeToSeconds(finishTime),
      parseTimeToSeconds(fifthPlaceTime),
    );

    await prisma.verifiedResult.create({
      data: {
        athleteId: athlete.id,
        seasonId: season.id,
        submissionId: submission.id,
        eventId: event.id,
        eventCategoryId: category.id,
        ageGroupUsed: ageGroup,
        fifthPlaceTimeSeconds: parseTimeToSeconds(fifthPlaceTime),
        lagPercent,
        awardedPoints: points,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: rule.id,
      },
    });
  }

  const verified = await prisma.verifiedResult.findMany({
    where: { seasonId: season.id },
    orderBy: [{ athleteId: "asc" }, { awardedPoints: "desc" }],
  });

  const grouped = new Map();
  for (const item of verified) {
    const bucket = grouped.get(item.athleteId) ?? [];
    if (bucket.length < 3) bucket.push(item.awardedPoints);
    grouped.set(item.athleteId, bucket);
  }

  const leaderboard = [];
  for (const [athleteId, scores] of grouped) {
    leaderboard.push({
      athleteId,
      totalPoints: scores.reduce((sum, score) => sum + score, 0),
      scoredResultsCount: scores.length,
    });
  }
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  for (const [index, entry] of leaderboard.entries()) {
    await prisma.rankingEntry.create({
      data: {
        athleteId: entry.athleteId,
        seasonId: season.id,
        totalPoints: entry.totalPoints,
        scoredResultsCount: entry.scoredResultsCount,
        rank: index + 1,
      },
    });
  }

  const snapshot = await prisma.rankingEntry.findMany({
    include: { athlete: true },
    orderBy: { rank: "asc" },
  });

  console.log(
    JSON.stringify(
      snapshot.map((entry) => ({
        rank: entry.rank,
        athlete: `${entry.athlete.firstName} ${entry.athlete.lastName}`,
        city: entry.athlete.city,
        totalPoints: entry.totalPoints,
      })),
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
