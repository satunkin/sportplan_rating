import "dotenv/config";

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import {
  PrismaClient,
  Discipline,
  VerificationMode,
  SubmissionStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getDatabaseUrl() {
  const runtimeDatabaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim() ?? "";

  if (runtimeDatabaseUrl && !runtimeDatabaseUrl.startsWith("file:")) {
    return runtimeDatabaseUrl;
  }

  if (postgresUrl) {
    return postgresUrl;
  }

  throw new Error(
    "PostgreSQL demo seed requires DATABASE_URL or DATABASE_URL_POSTGRES.",
  );
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
}

const prisma = createPrismaClient();
const currentYear = new Date().getFullYear();
const scrypt = promisify(scryptCallback);

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

const demoProfiles = [
  ["Алексей", "Волков", "Москва", "M35-39", "alexey.demo@cyclon.local", "MALE", "1989-04-17"],
  ["Марина", "Крылова", "Санкт-Петербург", "W30-34", "marina.demo@cyclon.local", "FEMALE", "1992-09-03"],
  ["Илья", "Серов", "Казань", "M40-44", "ilya.demo@cyclon.local", "MALE", "1984-01-29"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "anna.demo@cyclon.local", "FEMALE", "1996-06-11"],
];

const demoResults = [
  ["Алексей", "Волков", "Москва", "M35-39", "Весенний забег 10 км", Discipline.RUNNING, "10 км", "39:20", "38:30", "run_10k", "alexey.demo@cyclon.local", `${currentYear}-04-12`, "https://example.com/results/run10k"],
  ["Алексей", "Волков", "Москва", "M35-39", "Городской полумарафон", Discipline.RUNNING, "21 км", "01:28:20", "01:25:10", "run_21k", "alexey.demo@cyclon.local", `${currentYear}-05-18`, "https://example.com/results/half"],
  ["Марина", "Крылова", "Санкт-Петербург", "W30-34", "Open Water Cup", Discipline.SWIMMING, "3 км", "41:40", "39:50", "swim_mid", "marina.demo@cyclon.local", `${currentYear}-06-08`, "https://example.com/results/swim"],
  ["Марина", "Крылова", "Санкт-Петербург", "W30-34", "Cyclon Tri Sprint", Discipline.TRIATHLON, "Спринт", "01:17:30", "01:13:40", "tri_sprint", "marina.demo@cyclon.local", `${currentYear}-07-06`, "https://example.com/results/tri-sprint"],
  ["Илья", "Серов", "Казань", "M40-44", "Gran Fondo 90 км", Discipline.CYCLING, "90 км", "02:31:10", "02:24:20", "bike_mid", "ilya.demo@cyclon.local", `${currentYear}-06-15`, "https://example.com/results/granfondo"],
  ["Илья", "Серов", "Казань", "M40-44", "Cyclon Olympic Triathlon", Discipline.TRIATHLON, "Олимпийка", "02:24:10", "02:18:00", "tri_olympic", "ilya.demo@cyclon.local", `${currentYear}-08-03`, "https://example.com/results/olympic"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Ночной забег 5 км", Discipline.RUNNING, "5 км", "21:45", "20:50", "run_5k", "anna.demo@cyclon.local", `${currentYear}-05-24`, "https://example.com/results/night-run"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Осенний марафон", Discipline.RUNNING, "Марафон", "03:26:15", "03:18:40", "run_marathon", "anna.demo@cyclon.local", `${currentYear}-09-21`, "https://example.com/results/marathon"],
  ["Анна", "Лебедева", "Екатеринбург", "W25-29", "Cyclon Tri Half", Discipline.TRIATHLON, "Half Ironman", "05:14:30", "04:58:10", "tri_half", "anna.demo@cyclon.local", `${currentYear}-08-17`, "https://example.com/results/tri-half"],
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

async function createPasswordHash(password) {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Password must not be empty.");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(normalizedPassword, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
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

  for (const rule of scoreRules) {
    const category = await prisma.eventCategory.upsert({
      where: {
        discipline_categoryKey: {
          discipline: rule.discipline,
          categoryKey: rule.categoryKey,
        },
      },
      update: {
        label: rule.label,
        basePointsDefault: rule.basePoints,
        isActive: true,
      },
      create: {
        discipline: rule.discipline,
        categoryKey: rule.categoryKey,
        label: rule.label,
        basePointsDefault: rule.basePoints,
        isActive: true,
      },
    });

    await prisma.scoreRule.upsert({
      where: {
        id: `${season.id}:${rule.discipline}:${rule.categoryKey}`,
      },
      update: {
        basePoints: rule.basePoints,
        eventCategoryId: category.id,
      },
      create: {
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
  const demoPasswordHash = await createPasswordHash("demo-athlete-password");

  for (const [firstName, lastName, city, ageGroup, email, gender, birthDate] of demoProfiles) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: "ATHLETE",
        passwordHash: demoPasswordHash,
      },
      create: {
        email,
        role: "ATHLETE",
        passwordHash: demoPasswordHash,
      },
    });

    const athlete = await prisma.athlete.upsert({
      where: { userId: user.id },
      update: {
        firstName,
        lastName,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
        gender,
        city,
        seasonAgeGroup: ageGroup,
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
        gender,
        city,
        seasonAgeGroup: ageGroup,
      },
    });

    athletes.set(email, { user, athlete });
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
      eventDateRaw,
      protocolUrl,
    ] = row;

    const athleteRef = athletes.get(email);
    if (!athleteRef) continue;

    const category = await prisma.eventCategory.findUnique({
      where: {
        discipline_categoryKey: {
          discipline,
          categoryKey,
        },
      },
    });

    const rule = await prisma.scoreRule.findFirst({
      where: { seasonId: season.id, discipline, categoryKey },
    });

    if (!category || !rule) {
      throw new Error(`Missing demo score rule for ${discipline}/${categoryKey}`);
    }

    const eventDate = new Date(`${eventDateRaw}T09:00:00.000Z`);
    const event =
      (await prisma.event.findFirst({
        where: {
          name: eventName,
          eventDate,
          discipline,
          distanceLabel,
        },
      })) ??
      (await prisma.event.create({
        data: {
          name: eventName,
          eventDate,
          discipline,
          distanceLabel,
          sourceUrl: protocolUrl,
          categoryId: category.id,
        },
      }));

    if (event.sourceUrl !== protocolUrl || event.categoryId !== category.id) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          sourceUrl: protocolUrl,
          categoryId: category.id,
        },
      });
    }

    const finishTimeSeconds = parseTimeToSeconds(finishTime);
    const submission =
      (await prisma.resultSubmission.findFirst({
        where: {
          athleteId: athleteRef.athlete.id,
          seasonId: season.id,
          eventNameRaw: eventName,
          eventDate,
          discipline,
          distanceLabel,
          finishTimeSeconds,
        },
      })) ??
      (await prisma.resultSubmission.create({
        data: {
          athleteId: athleteRef.athlete.id,
          seasonId: season.id,
          eventId: event.id,
          eventNameRaw: eventName,
          eventDate,
          discipline,
          distanceLabel,
          ageGroupClaimed: ageGroup,
          finishTimeRaw: finishTime,
          finishTimeSeconds,
          protocolUrl,
          comment: "Демо-заполнение для проверки рейтинга",
          status: SubmissionStatus.VERIFIED,
          adminNotes: "Демо-подтверждение для просмотра рейтинга",
        },
      }));

    await prisma.resultSubmission.update({
      where: { id: submission.id },
      data: {
        eventId: event.id,
        ageGroupClaimed: ageGroup,
        protocolUrl,
        status: SubmissionStatus.VERIFIED,
        adminNotes: "Демо-подтверждение для просмотра рейтинга",
        comment: "Демо-заполнение для проверки рейтинга",
      },
    });

    const { lagPercent, points } = calculatePoints(
      rule.basePoints,
      finishTimeSeconds,
      parseTimeToSeconds(fifthPlaceTime),
    );

    await prisma.verifiedResult.upsert({
      where: {
        submissionId: submission.id,
      },
      update: {
        athleteId: athleteRef.athlete.id,
        seasonId: season.id,
        eventId: event.id,
        eventCategoryId: category.id,
        ageGroupUsed: ageGroup,
        fifthPlaceTimeSeconds: parseTimeToSeconds(fifthPlaceTime),
        lagPercent,
        awardedPoints: points,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: rule.id,
      },
      create: {
        athleteId: athleteRef.athlete.id,
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

  await prisma.rankingEntry.deleteMany({
    where: { seasonId: season.id },
  });

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
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
