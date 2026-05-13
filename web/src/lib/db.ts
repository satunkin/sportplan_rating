import {
  Discipline,
  Gender,
  Prisma,
  ReviewDecision,
  VerificationMode,
  SeasonStatus,
  SubmissionStatus,
  UserRole,
} from "@prisma/client";

import type { AthleteProfile } from "@/lib/athlete-profile";
import { ensureDatabaseReady } from "@/lib/db-bootstrap";
import type { ResultSubmissionInput } from "@/lib/result-submission";
import { prisma } from "@/lib/prisma";
import {
  calculateLagPercent,
  calculatePoints,
  getDisciplineCategories,
  SCORE_RULES,
} from "@/lib/scoring";
import { parseTimeToSeconds } from "@/lib/time";

const CURRENT_SEASON_YEAR = new Date().getFullYear();

async function ensureCurrentSeason() {
  await ensureDatabaseReady();

  return prisma.season.upsert({
    where: {
      name: `${CURRENT_SEASON_YEAR} Season`,
    },
    update: {},
    create: {
      name: `${CURRENT_SEASON_YEAR} Season`,
      startDate: new Date(`${CURRENT_SEASON_YEAR}-01-01T00:00:00.000Z`),
      endDate: new Date(`${CURRENT_SEASON_YEAR}-12-31T23:59:59.000Z`),
      status: SeasonStatus.ACTIVE,
    },
  });
}

async function ensureScoreRuleSeed(seasonId: string) {
  await ensureDatabaseReady();

  for (const rule of SCORE_RULES) {
    const eventCategory = await prisma.eventCategory.upsert({
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
        id: `${seasonId}:${rule.discipline}:${rule.categoryKey}`,
      },
      update: {
        basePoints: rule.basePoints,
        eventCategoryId: eventCategory.id,
      },
      create: {
        id: `${seasonId}:${rule.discipline}:${rule.categoryKey}`,
        seasonId,
        discipline: rule.discipline,
        categoryKey: rule.categoryKey,
        basePoints: rule.basePoints,
        eventCategoryId: eventCategory.id,
      },
    });
  }
}

export async function upsertAthleteProfile(profile: AthleteProfile) {
  await ensureDatabaseReady();

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      role: UserRole.ATHLETE,
    },
    create: {
      email: profile.email,
      role: UserRole.ATHLETE,
    },
  });

  const athlete = await prisma.athlete.upsert({
    where: { userId: user.id },
    update: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName || null,
      birthDate: new Date(profile.birthDate),
      gender: profile.gender === "male" ? Gender.MALE : Gender.FEMALE,
      city: profile.city,
      seasonAgeGroup: profile.seasonAgeGroup,
    },
    create: {
      userId: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName || null,
      birthDate: new Date(profile.birthDate),
      gender: profile.gender === "male" ? Gender.MALE : Gender.FEMALE,
      city: profile.city,
      seasonAgeGroup: profile.seasonAgeGroup,
    },
  });

  return { user, athlete };
}

export async function getAthleteProfileByUserId(userId: string) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!athlete || !athlete.user.email) {
    return null;
  }

  const seasonYear = CURRENT_SEASON_YEAR;
  const seasonAge =
    seasonYear -
    athlete.birthDate.getUTCFullYear() -
    (new Date(Date.UTC(seasonYear, 11, 31)).getUTCMonth() <
      athlete.birthDate.getUTCMonth() ||
    (new Date(Date.UTC(seasonYear, 11, 31)).getUTCMonth() ===
      athlete.birthDate.getUTCMonth() &&
      new Date(Date.UTC(seasonYear, 11, 31)).getUTCDate() <
        athlete.birthDate.getUTCDate())
      ? 1
      : 0);

  return {
    id: athlete.id,
    userId: athlete.userId,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    middleName: athlete.middleName ?? "",
    email: athlete.user.email,
    city: athlete.city ?? "",
    birthDate: athlete.birthDate.toISOString().slice(0, 10),
    gender: athlete.gender === Gender.MALE ? "male" : "female",
    seasonYear,
    seasonAge,
    seasonAgeGroup: athlete.seasonAgeGroup ?? "",
  };
}

export async function createResultSubmissionForUser(
  userId: string,
  input: ResultSubmissionInput,
) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
  });

  if (!athlete) {
    throw new Error("ATHLETE_NOT_FOUND");
  }

  const season = await ensureCurrentSeason();
  const finishTimeSeconds = parseTimeToSeconds(input.finishTime);

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId: athlete.id,
      seasonId: season.id,
      eventNameRaw: input.eventName,
      eventDate: new Date(input.eventDate),
      discipline: input.discipline as Discipline,
      distanceLabel: input.distanceLabel,
      ageGroupClaimed: input.ageGroupClaimed,
      finishTimeRaw: input.finishTime,
      finishTimeSeconds,
      protocolUrl: input.protocolUrl,
      comment: input.comment || null,
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    },
  });
}

export async function listSubmissionsForUser(userId: string) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
  });

  if (!athlete) {
    return [];
  }

  return prisma.resultSubmission.findMany({
    where: { athleteId: athlete.id },
    include: {
      verifiedResult: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function ensureAdminUser() {
  await ensureDatabaseReady();

  return prisma.user.upsert({
    where: {
      email: "admin@cyclon.local",
    },
    update: {
      role: UserRole.ADMIN,
    },
    create: {
      email: "admin@cyclon.local",
      role: UserRole.ADMIN,
    },
  });
}

export async function listPendingSubmissions() {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();
  await ensureScoreRuleSeed(season.id);

  return prisma.resultSubmission.findMany({
    where: {
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    },
    include: {
      athlete: {
        include: {
          user: true,
        },
      },
      season: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

async function recalculateSeasonRanking(seasonId: string) {
  const verified = await prisma.verifiedResult.findMany({
    where: { seasonId },
    include: {
      athlete: true,
    },
    orderBy: [{ athleteId: "asc" }, { awardedPoints: "desc" }],
  });

  const grouped = new Map<
    string,
    {
      athleteId: string;
      bestScores: number[];
    }
  >();

  for (const item of verified) {
    const bucket = grouped.get(item.athleteId) ?? {
      athleteId: item.athleteId,
      bestScores: [],
    };

    if (bucket.bestScores.length < 3) {
      bucket.bestScores.push(item.awardedPoints);
    }

    grouped.set(item.athleteId, bucket);
  }

  const leaderboard = Array.from(grouped.values())
    .map((entry) => ({
      athleteId: entry.athleteId,
      scoredResultsCount: entry.bestScores.length,
      totalPoints: entry.bestScores.reduce((sum, score) => sum + score, 0),
    }))
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      return right.scoredResultsCount - left.scoredResultsCount;
    });

  await prisma.rankingEntry.deleteMany({
    where: { seasonId },
  });

  for (const [index, entry] of leaderboard.entries()) {
    await prisma.rankingEntry.create({
      data: {
        athleteId: entry.athleteId,
        seasonId,
        totalPoints: entry.totalPoints,
        rank: index + 1,
        scoredResultsCount: entry.scoredResultsCount,
      },
    });
  }
}

export async function reviewSubmission(
  submissionId: string,
  decision: "approve" | "reject",
  notes: string,
  scoringInput?: {
    categoryKey: string;
    fifthPlaceTime: string;
  },
) {
  await ensureDatabaseReady();

  const admin = await ensureAdminUser();
  const submissionBefore = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submissionBefore) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  let preparedApproval:
    | {
        seasonId: string;
        scoreRule: Awaited<ReturnType<typeof prisma.scoreRule.findFirst>>;
        eventCategory: Awaited<ReturnType<typeof prisma.eventCategory.findFirst>>;
        fifthPlaceTimeSeconds: number;
        lagPercent: number;
        awardedPoints: number;
      }
    | undefined;

  if (decision === "approve") {
    if (!scoringInput?.categoryKey || !scoringInput.fifthPlaceTime) {
      throw new Error("SCORING_INPUT_REQUIRED");
    }

    const fifthPlaceTimeSeconds = parseTimeToSeconds(scoringInput.fifthPlaceTime);

    if (fifthPlaceTimeSeconds === null) {
      throw new Error("INVALID_FIFTH_PLACE_TIME");
    }

    const season = await ensureCurrentSeason();
    await ensureScoreRuleSeed(season.id);

    const scoreRule = await prisma.scoreRule.findFirst({
      where: {
        seasonId: season.id,
        discipline: submissionBefore.discipline,
        categoryKey: scoringInput.categoryKey,
      },
    });

    if (!scoreRule) {
      throw new Error("SCORE_RULE_NOT_FOUND");
    }

    const eventCategory = await prisma.eventCategory.findFirst({
      where: {
        discipline: submissionBefore.discipline,
        categoryKey: scoringInput.categoryKey,
      },
    });

    const lagPercent = calculateLagPercent(
      submissionBefore.finishTimeSeconds,
      fifthPlaceTimeSeconds,
    );
    const awardedPoints = calculatePoints(scoreRule.basePoints, lagPercent);

    preparedApproval = {
      seasonId: season.id,
      scoreRule,
      eventCategory,
      fifthPlaceTimeSeconds,
      lagPercent,
      awardedPoints,
    };
  }

  const submission = await prisma.resultSubmission.update({
    where: { id: submissionId },
    data: {
      status:
        decision === "approve"
          ? SubmissionStatus.VERIFIED
          : SubmissionStatus.REJECTED,
      adminNotes: notes || null,
      reviews: {
        create: {
          reviewerId: admin.id,
          decision:
            decision === "approve"
              ? ReviewDecision.APPROVED
              : ReviewDecision.REJECTED,
          notes: notes || null,
        },
      },
    },
    include: {
      athlete: true,
    },
  });

  if (decision === "approve") {
    if (!preparedApproval) {
      throw new Error("APPROVAL_NOT_PREPARED");
    }

    const event = await prisma.event.create({
      data: {
        name: submission.eventNameRaw,
        eventDate: submission.eventDate,
        discipline: submission.discipline,
        distanceLabel: submission.distanceLabel,
        sourceUrl: submission.protocolUrl ?? null,
        categoryId: preparedApproval.eventCategory?.id,
      },
    });

    await prisma.resultSubmission.update({
      where: { id: submission.id },
      data: {
        eventId: event.id,
      },
    });

    await prisma.verifiedResult.upsert({
      where: {
        submissionId: submission.id,
      },
      update: {
        eventId: event.id,
        eventCategoryId: preparedApproval.eventCategory?.id,
        ageGroupUsed: submission.ageGroupClaimed,
        fifthPlaceTimeSeconds: preparedApproval.fifthPlaceTimeSeconds,
        lagPercent: new Prisma.Decimal(preparedApproval.lagPercent),
        awardedPoints: preparedApproval.awardedPoints,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: preparedApproval.scoreRule!.id,
      },
      create: {
        athleteId: submission.athleteId,
        seasonId: submission.seasonId,
        submissionId: submission.id,
        eventId: event.id,
        eventCategoryId: preparedApproval.eventCategory?.id,
        ageGroupUsed: submission.ageGroupClaimed,
        fifthPlaceTimeSeconds: preparedApproval.fifthPlaceTimeSeconds,
        lagPercent: new Prisma.Decimal(preparedApproval.lagPercent),
        awardedPoints: preparedApproval.awardedPoints,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: preparedApproval.scoreRule!.id,
      },
    });

    await recalculateSeasonRanking(submission.seasonId);
  } else {
    await prisma.verifiedResult.deleteMany({
      where: {
        submissionId: submission.id,
      },
    });

    await recalculateSeasonRanking(submission.seasonId);
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      entityType: "ResultSubmission",
      entityId: submission.id,
      action: decision === "approve" ? "VERIFY_SUBMISSION" : "REJECT_SUBMISSION",
      payloadJson: {
        notes,
        athleteId: submission.athleteId,
        eventNameRaw: submissionBefore.eventNameRaw,
        categoryKey: scoringInput?.categoryKey ?? null,
        fifthPlaceTime: scoringInput?.fifthPlaceTime ?? null,
      },
    },
  });

  return submission;
}

export async function listLeaderboard(filters?: {
  discipline?: string;
  ageGroup?: string;
}) {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();
  await ensureScoreRuleSeed(season.id);

  const entries = await prisma.rankingEntry.findMany({
    where: {
      seasonId: season.id,
    },
    include: {
      athlete: {
        include: {
          user: true,
          verifiedResults: {
            where: { seasonId: season.id },
            orderBy: { awardedPoints: "desc" },
            take: 3,
            include: {
              submission: true,
            },
          },
        },
      },
    },
    orderBy: { rank: "asc" },
  });

  return entries.filter((entry) => {
    const matchesAgeGroup =
      !filters?.ageGroup ||
      filters.ageGroup === "all" ||
      entry.athlete.seasonAgeGroup === filters.ageGroup;

    const matchesDiscipline =
      !filters?.discipline ||
      filters.discipline === "all" ||
      entry.athlete.verifiedResults.some(
        (result) => result.submission.discipline === filters.discipline,
      );

    return matchesAgeGroup && matchesDiscipline;
  });
}

export function getCategoryOptionsForDiscipline(discipline: Discipline) {
  return getDisciplineCategories(discipline);
}

export async function getLeaderboardFilterOptions() {
  const entries = await listLeaderboard();

  const ageGroups = Array.from(
    new Set(
      entries
        .map((entry) => entry.athlete.seasonAgeGroup)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  return {
    ageGroups,
    disciplines: Object.values(Discipline),
  };
}

export async function getPublicAthleteProfile(athleteId: string) {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();

  return prisma.rankingEntry.findFirst({
    where: {
      seasonId: season.id,
      athleteId,
    },
    include: {
      athlete: {
        include: {
          verifiedResults: {
            where: { seasonId: season.id },
            orderBy: { awardedPoints: "desc" },
            include: {
              submission: true,
            },
          },
        },
      },
    },
  });
}

export async function seedDemoScenario() {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();
  await ensureScoreRuleSeed(season.id);

  await prisma.auditLog.deleteMany();
  await prisma.manualReview.deleteMany();
  await prisma.verifiedResult.deleteMany();
  await prisma.rankingEntry.deleteMany();
  await prisma.resultSubmission.deleteMany();
  await prisma.event.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        not: "admin@cyclon.local",
      },
    },
  });

  const demoProfiles: AthleteProfile[] = [
    {
      firstName: "Алексей",
      lastName: "Волков",
      middleName: "",
      email: "alexey.demo@cyclon.local",
      city: "Москва",
      birthDate: "1989-04-17",
      gender: "male",
      seasonYear: CURRENT_SEASON_YEAR,
      seasonAge: 36,
      seasonAgeGroup: "M35-39",
    },
    {
      firstName: "Марина",
      lastName: "Крылова",
      middleName: "",
      email: "marina.demo@cyclon.local",
      city: "Санкт-Петербург",
      birthDate: "1992-09-03",
      gender: "female",
      seasonYear: CURRENT_SEASON_YEAR,
      seasonAge: 33,
      seasonAgeGroup: "W30-34",
    },
    {
      firstName: "Илья",
      lastName: "Серов",
      middleName: "",
      email: "ilya.demo@cyclon.local",
      city: "Казань",
      birthDate: "1984-01-29",
      gender: "male",
      seasonYear: CURRENT_SEASON_YEAR,
      seasonAge: 41,
      seasonAgeGroup: "M40-44",
    },
    {
      firstName: "Анна",
      lastName: "Лебедева",
      middleName: "",
      email: "anna.demo@cyclon.local",
      city: "Екатеринбург",
      birthDate: "1996-06-11",
      gender: "female",
      seasonYear: CURRENT_SEASON_YEAR,
      seasonAge: 29,
      seasonAgeGroup: "W25-29",
    },
  ];

  const athletes = new Map<string, Awaited<ReturnType<typeof upsertAthleteProfile>>>();

  for (const profile of demoProfiles) {
    athletes.set(profile.email, await upsertAthleteProfile(profile));
  }

  const demoResults = [
    {
      email: "alexey.demo@cyclon.local",
      eventName: "Весенний забег 10 км",
      eventDate: `${CURRENT_SEASON_YEAR}-04-12`,
      discipline: Discipline.RUNNING,
      distanceLabel: "10 км",
      ageGroupClaimed: "M35-39",
      finishTime: "39:20",
      fifthPlaceTime: "38:30",
      protocolUrl: "https://example.com/results/run10k",
      categoryKey: "run_10k",
    },
    {
      email: "alexey.demo@cyclon.local",
      eventName: "Городской полумарафон",
      eventDate: `${CURRENT_SEASON_YEAR}-05-18`,
      discipline: Discipline.RUNNING,
      distanceLabel: "21 км",
      ageGroupClaimed: "M35-39",
      finishTime: "01:28:20",
      fifthPlaceTime: "01:25:10",
      protocolUrl: "https://example.com/results/half",
      categoryKey: "run_21k",
    },
    {
      email: "marina.demo@cyclon.local",
      eventName: "Open Water Cup",
      eventDate: `${CURRENT_SEASON_YEAR}-06-08`,
      discipline: Discipline.SWIMMING,
      distanceLabel: "3 км",
      ageGroupClaimed: "W30-34",
      finishTime: "41:40",
      fifthPlaceTime: "39:50",
      protocolUrl: "https://example.com/results/swim",
      categoryKey: "swim_mid",
    },
    {
      email: "marina.demo@cyclon.local",
      eventName: "Cyclon Tri Sprint",
      eventDate: `${CURRENT_SEASON_YEAR}-07-06`,
      discipline: Discipline.TRIATHLON,
      distanceLabel: "Спринт",
      ageGroupClaimed: "W30-34",
      finishTime: "01:17:30",
      fifthPlaceTime: "01:13:40",
      protocolUrl: "https://example.com/results/tri-sprint",
      categoryKey: "tri_sprint",
    },
    {
      email: "ilya.demo@cyclon.local",
      eventName: "Gran Fondo 90 км",
      eventDate: `${CURRENT_SEASON_YEAR}-06-15`,
      discipline: Discipline.CYCLING,
      distanceLabel: "90 км",
      ageGroupClaimed: "M40-44",
      finishTime: "02:31:10",
      fifthPlaceTime: "02:24:20",
      protocolUrl: "https://example.com/results/granfondo",
      categoryKey: "bike_mid",
    },
    {
      email: "ilya.demo@cyclon.local",
      eventName: "Cyclon Olympic Triathlon",
      eventDate: `${CURRENT_SEASON_YEAR}-08-03`,
      discipline: Discipline.TRIATHLON,
      distanceLabel: "Олимпийка",
      ageGroupClaimed: "M40-44",
      finishTime: "02:24:10",
      fifthPlaceTime: "02:18:00",
      protocolUrl: "https://example.com/results/olympic",
      categoryKey: "tri_olympic",
    },
    {
      email: "anna.demo@cyclon.local",
      eventName: "Ночной забег 5 км",
      eventDate: `${CURRENT_SEASON_YEAR}-05-24`,
      discipline: Discipline.RUNNING,
      distanceLabel: "5 км",
      ageGroupClaimed: "W25-29",
      finishTime: "21:45",
      fifthPlaceTime: "20:50",
      protocolUrl: "https://example.com/results/night-run",
      categoryKey: "run_5k",
    },
    {
      email: "anna.demo@cyclon.local",
      eventName: "Осенний марафон",
      eventDate: `${CURRENT_SEASON_YEAR}-09-21`,
      discipline: Discipline.RUNNING,
      distanceLabel: "Марафон",
      ageGroupClaimed: "W25-29",
      finishTime: "03:26:15",
      fifthPlaceTime: "03:18:40",
      protocolUrl: "https://example.com/results/marathon",
      categoryKey: "run_marathon",
    },
    {
      email: "anna.demo@cyclon.local",
      eventName: "Cyclon Tri Half",
      eventDate: `${CURRENT_SEASON_YEAR}-08-17`,
      discipline: Discipline.TRIATHLON,
      distanceLabel: "Half Ironman",
      ageGroupClaimed: "W25-29",
      finishTime: "05:14:30",
      fifthPlaceTime: "04:58:10",
      protocolUrl: "https://example.com/results/tri-half",
      categoryKey: "tri_half",
    },
  ];

  for (const item of demoResults) {
    const athleteRef = athletes.get(item.email);

    if (!athleteRef) {
      continue;
    }

    const submission = await createResultSubmissionForUser(athleteRef.user.id, {
      eventName: item.eventName,
      eventDate: item.eventDate,
      discipline: item.discipline,
      distanceLabel: item.distanceLabel,
      ageGroupClaimed: item.ageGroupClaimed,
      finishTime: item.finishTime,
      protocolUrl: item.protocolUrl,
      comment: "Демо-заполнение для проверки рейтинга",
    });

    await reviewSubmission(
      submission.id,
      "approve",
      "Демо-подтверждение для просмотра рейтинга",
      {
        categoryKey: item.categoryKey,
        fifthPlaceTime: item.fifthPlaceTime,
      },
    );
  }

  return listLeaderboard();
}
