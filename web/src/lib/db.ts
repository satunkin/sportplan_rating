import {
  EntityStatus,
  Discipline,
  Gender,
  Prisma,
  ReviewDecision,
  VerificationMode,
  SeasonStatus,
  SubmissionStatus,
  SubmissionType,
  UserRole,
} from "@prisma/client";
import { unstable_cache } from "next/cache";

import type { AdminAthleteProfile, AthleteProfile } from "@/lib/athlete-profile";
import { ensureDatabaseReady } from "@/lib/db-bootstrap";
import {
  createMagicLinkToken,
  getMagicLinkExpiryDate,
  hashMagicLinkToken,
} from "@/lib/magic-link";
import { createPasswordHash, verifyPasswordHash } from "@/lib/password-auth";
import type { ResultSubmissionInput } from "@/lib/result-submission";
import { prisma } from "@/lib/prisma";
import {
  PUBLIC_DATA_CACHE_TAG,
  PUBLIC_DATA_REVALIDATE_SECONDS,
} from "@/lib/public-cache";
import { importProtocolForEvent } from "@/lib/protocol-import/import-source-protocol";
import {
  calculateLagPercent,
  calculatePoints,
  getDisciplineCategories,
  SCORE_RULES,
} from "@/lib/scoring";
import { parseTimeToSeconds } from "@/lib/time";
import { notifyAthleteById } from "@/lib/telegram/notifications";

const CURRENT_SEASON_YEAR = new Date().getFullYear();
const DEMO_ATHLETE_PASSWORD = "demo-athlete-password";

type DemoProfileSeed = AthleteProfile;

type DemoResultSeed = {
  email: string;
  eventName: string;
  eventDate: string;
  discipline: Discipline;
  distanceLabel: string;
  ageGroupClaimed: string;
  finishTime: string;
  fifthPlaceTime: string;
  protocolUrl: string;
  categoryKey: string;
};

type SubmissionDuplicateFingerprint = {
  athleteId: string;
  seasonId: string;
  eventNameRaw: string;
  eventDate: Date;
  discipline: Discipline;
  distanceLabel: string;
  finishTimeSeconds: number;
  excludeSubmissionId?: string;
  statuses?: SubmissionStatus[];
};

type EventFingerprint = {
  eventName: string;
  eventDate: Date;
  discipline: Discipline;
  distanceLabel: string;
};

const DEMO_PROFILES: DemoProfileSeed[] = [
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
    publicDisplayName: "Алексей Волков",
    showPublicResults: true,
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
    publicDisplayName: "Марина Крылова",
    showPublicResults: true,
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
    publicDisplayName: "Илья Серов",
    showPublicResults: true,
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
    publicDisplayName: "Анна Лебедева",
    showPublicResults: true,
  },
];

const DEMO_RESULTS: DemoResultSeed[] = [
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

async function findCurrentSeason() {
  await ensureDatabaseReady();

  return prisma.season.findUnique({
    where: {
      name: `${CURRENT_SEASON_YEAR} Season`,
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

async function upsertDemoAthleteProfile(profile: DemoProfileSeed) {
  const passwordHash = await createPasswordHash(DEMO_ATHLETE_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      role: UserRole.ATHLETE,
      passwordHash,
    },
    create: {
      email: profile.email,
      role: UserRole.ATHLETE,
      passwordHash,
    },
  });

  const athlete = await prisma.athlete.upsert({
    where: { userId: user.id },
    update: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName || null,
      publicDisplayName:
        profile.publicDisplayName ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      showPublicResults: true,
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
      publicDisplayName:
        profile.publicDisplayName ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      showPublicResults: true,
      birthDate: new Date(profile.birthDate),
      gender: profile.gender === "male" ? Gender.MALE : Gender.FEMALE,
      city: profile.city,
      seasonAgeGroup: profile.seasonAgeGroup,
    },
  });

  return { user, athlete };
}

async function upsertDemoEvent(params: {
  categoryId?: string | null;
  discipline: Discipline;
  distanceLabel: string;
  eventDate: Date;
  eventName: string;
  protocolUrl: string;
}) {
  const existingEvent = await prisma.event.findFirst({
    where: {
      name: params.eventName,
      eventDate: params.eventDate,
      discipline: params.discipline,
      distanceLabel: params.distanceLabel,
    },
  });

  if (existingEvent) {
    return prisma.event.update({
      where: { id: existingEvent.id },
      data: {
        sourceUrl: params.protocolUrl,
        categoryId: params.categoryId ?? null,
      },
    });
  }

  return prisma.event.create({
    data: {
      name: params.eventName,
      eventDate: params.eventDate,
      discipline: params.discipline,
      distanceLabel: params.distanceLabel,
      sourceUrl: params.protocolUrl,
      categoryId: params.categoryId ?? null,
    },
  });
}

async function upsertDemoSubmission(params: {
  athleteId: string;
  seasonId: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  discipline: Discipline;
  distanceLabel: string;
  ageGroupClaimed: string;
  finishTime: string;
  finishTimeSeconds: number;
  protocolUrl: string;
}) {
  const existingSubmission = await prisma.resultSubmission.findFirst({
    where: {
      athleteId: params.athleteId,
      seasonId: params.seasonId,
      eventNameRaw: params.eventName,
      eventDate: params.eventDate,
      discipline: params.discipline,
      distanceLabel: params.distanceLabel,
      finishTimeSeconds: params.finishTimeSeconds,
    },
  });

  const sharedData = {
    eventId: params.eventId,
    eventNameRaw: params.eventName,
    eventDate: params.eventDate,
    discipline: params.discipline,
    distanceLabel: params.distanceLabel,
    ageGroupClaimed: params.ageGroupClaimed,
    finishTimeRaw: params.finishTime,
    finishTimeSeconds: params.finishTimeSeconds,
    protocolUrl: params.protocolUrl,
    comment: "Демо-заполнение для проверки рейтинга",
    status: SubmissionStatus.VERIFIED,
    adminNotes: "Демо-подтверждение для просмотра рейтинга",
  };

  if (existingSubmission) {
    return prisma.resultSubmission.update({
      where: { id: existingSubmission.id },
      data: sharedData,
    });
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId: params.athleteId,
      seasonId: params.seasonId,
      ...sharedData,
    },
  });
}

async function findDuplicateSubmission(
  fingerprint: SubmissionDuplicateFingerprint,
) {
  return prisma.resultSubmission.findFirst({
    where: {
      athleteId: fingerprint.athleteId,
      seasonId: fingerprint.seasonId,
      eventNameRaw: fingerprint.eventNameRaw,
      eventDate: fingerprint.eventDate,
      discipline: fingerprint.discipline,
      distanceLabel: fingerprint.distanceLabel,
      finishTimeSeconds: fingerprint.finishTimeSeconds,
      ...(fingerprint.excludeSubmissionId
        ? {
            id: {
              not: fingerprint.excludeSubmissionId,
            },
          }
        : {}),
      ...(fingerprint.statuses?.length
        ? {
            status: {
              in: fingerprint.statuses,
            },
          }
        : {}),
    },
  });
}

async function findEventByFingerprint(fingerprint: EventFingerprint) {
  return prisma.event.findFirst({
    where: {
      name: fingerprint.eventName,
      eventDate: fingerprint.eventDate,
      discipline: fingerprint.discipline,
      distanceLabel: fingerprint.distanceLabel,
    },
    include: {
      category: true,
      competition: true,
      protocolGroups: true,
    },
  });
}

function normalizeCategoryMatchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function normalizeCompactCategoryMatchValue(value: string) {
  return normalizeCategoryMatchValue(value).replace(/[\s._-]+/g, "");
}

function inferCategoryKeyFromDistanceLabel(
  discipline: Discipline,
  distanceLabel: string,
) {
  const normalizedDistance = normalizeCategoryMatchValue(distanceLabel);
  const compactDistance = normalizeCompactCategoryMatchValue(distanceLabel);

  return SCORE_RULES.find((rule) => {
    if (rule.discipline !== discipline) {
      return false;
    }

    return (
      normalizeCategoryMatchValue(rule.label) === normalizedDistance ||
      normalizeCompactCategoryMatchValue(rule.label) === compactDistance ||
      normalizeCategoryMatchValue(rule.categoryKey) === normalizedDistance ||
      normalizeCompactCategoryMatchValue(rule.categoryKey) === compactDistance
    );
  })?.categoryKey;
}

async function resolveAdminScoringCategoryKey(
  input: ResultSubmissionInput,
  fallbackCategoryKey?: string | null,
) {
  if (input.categoryKey?.trim()) {
    return input.categoryKey.trim();
  }

  const eventDate = new Date(input.eventDate);
  const matchedEvent = await findEventByFingerprint({
    eventName: input.eventName,
    eventDate,
    discipline: input.discipline as Discipline,
    distanceLabel: input.distanceLabel,
  });

  return (
    matchedEvent?.category?.categoryKey ??
    inferCategoryKeyFromDistanceLabel(
      input.discipline as Discipline,
      input.distanceLabel,
    ) ??
    fallbackCategoryKey ??
    null
  );
}

async function ensureEventForSubmission(params: {
  categoryId?: string | null;
  discipline: Discipline;
  distanceLabel: string;
  eventDate: Date;
  eventName: string;
  location?: string | null;
  sourceUrl?: string | null;
}) {
  const existingEvent = await findEventByFingerprint({
    eventName: params.eventName,
    eventDate: params.eventDate,
    discipline: params.discipline,
    distanceLabel: params.distanceLabel,
  });

  const normalizedLocation = params.location?.trim() || null;
  const normalizedSourceUrl = params.sourceUrl?.trim() || null;

  if (existingEvent) {
    return prisma.event.update({
      where: { id: existingEvent.id },
      data: {
        categoryId: params.categoryId ?? existingEvent.categoryId ?? null,
        location: normalizedLocation ?? existingEvent.location ?? null,
        sourceUrl: normalizedSourceUrl ?? existingEvent.sourceUrl ?? null,
      },
    });
  }

  const competition = await prisma.competition.create({
    data: {
      name: params.eventName,
      eventDate: params.eventDate,
      city: normalizedLocation,
      resultsUrl: normalizedSourceUrl,
    },
  });

  return prisma.event.create({
    data: {
      competitionId: competition.id,
      name: params.eventName,
      eventDate: params.eventDate,
      discipline: params.discipline,
      distanceLabel: params.distanceLabel,
      sourceUrl: normalizedSourceUrl,
      location: normalizedLocation,
      categoryId: params.categoryId ?? null,
    },
  });
}

export async function upsertAthleteProfile(
  profile: AthleteProfile,
  password: string,
) {
  await ensureDatabaseReady();

  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email },
    include: { athlete: true },
  });

  if (existingUser?.passwordHash) {
    throw new Error("EMAIL_ALREADY_REGISTERED");
  }

  const passwordHash = await createPasswordHash(password);

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {
      role: UserRole.ATHLETE,
      passwordHash,
    },
    create: {
      email: profile.email,
      role: UserRole.ATHLETE,
      passwordHash,
    },
  });

  const athlete = await prisma.athlete.upsert({
    where: { userId: user.id },
    update: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName || null,
      publicDisplayName:
        profile.publicDisplayName ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      showPublicResults: profile.showPublicResults,
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
      publicDisplayName:
        profile.publicDisplayName ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      showPublicResults: profile.showPublicResults,
      birthDate: new Date(profile.birthDate),
      gender: profile.gender === "male" ? Gender.MALE : Gender.FEMALE,
      city: profile.city,
      seasonAgeGroup: profile.seasonAgeGroup,
    },
  });

  return { user, athlete };
}

export async function authenticateAthleteUser(email: string, password: string) {
  await ensureDatabaseReady();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.passwordHash || user.role !== UserRole.ATHLETE) {
    return null;
  }

  const passwordMatches = await verifyPasswordHash(password, user.passwordHash);

  return passwordMatches ? user : null;
}

export async function authenticateAdminUser(email: string, password: string) {
  await ensureDatabaseReady();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user?.passwordHash || user.role !== UserRole.ADMIN) {
    return null;
  }

  const passwordMatches = await verifyPasswordHash(password, user.passwordHash);

  return passwordMatches ? user : null;
}

export async function issueAthleteMagicLink(email: string) {
  await ensureDatabaseReady();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      email: normalizedEmail,
      token: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.role !== UserRole.ATHLETE) {
    return {
      email: normalizedEmail,
      token: null,
    };
  }

  await prisma.magicLinkToken.deleteMany({
    where: { userId: user.id },
  });

  const token = createMagicLinkToken();

  await prisma.magicLinkToken.create({
    data: {
      userId: user.id,
      tokenHash: hashMagicLinkToken(token),
      expiresAt: getMagicLinkExpiryDate(),
    },
  });

  return {
    email: normalizedEmail,
    token,
  };
}

export async function consumeAthleteMagicLink(token: string) {
  await ensureDatabaseReady();

  const tokenHash = hashMagicLinkToken(token);
  const magicLinkToken = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!magicLinkToken) {
    return null;
  }

  if (magicLinkToken.usedAt || magicLinkToken.expiresAt <= new Date()) {
    return null;
  }

  await prisma.magicLinkToken.update({
    where: { id: magicLinkToken.id },
    data: { usedAt: new Date() },
  });

  if (magicLinkToken.user.role !== UserRole.ATHLETE) {
    return null;
  }

  return magicLinkToken.user;
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
    publicDisplayName:
      athlete.publicDisplayName ??
      `${athlete.firstName} ${athlete.lastName}`.trim(),
    showPublicResults: athlete.showPublicResults,
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
  const eventDate = new Date(input.eventDate);
  const finishTimeSeconds = parseTimeToSeconds(input.finishTime);

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  const existingDuplicate = await findDuplicateSubmission({
    athleteId: athlete.id,
    seasonId: season.id,
    eventNameRaw: input.eventName,
    eventDate,
    discipline: input.discipline as Discipline,
    distanceLabel: input.distanceLabel,
    finishTimeSeconds,
    statuses: [
      SubmissionStatus.PENDING_MANUAL_REVIEW,
      SubmissionStatus.VERIFIED,
    ],
  });

  if (existingDuplicate) {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId: athlete.id,
      seasonId: season.id,
      eventNameRaw: input.eventName,
      eventDate,
      discipline: input.discipline as Discipline,
      distanceLabel: input.distanceLabel,
      ageGroupClaimed: input.ageGroupClaimed,
      finishTimeRaw: input.finishTime,
      finishTimeSeconds,
      protocolUrl: input.protocolUrl || null,
      placementOverall: input.placementOverall
        ? Number.parseInt(input.placementOverall, 10)
        : null,
      placementInAgeGroup: input.placementInAgeGroup
        ? Number.parseInt(input.placementInAgeGroup, 10)
        : null,
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
      verifiedResult: {
        include: {
          scoreRule: true,
        },
      },
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

  const submissions = await prisma.resultSubmission.findMany({
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

  const eventMatches = await Promise.all(
    submissions.map((submission) =>
      findEventByFingerprint({
        eventName: submission.eventNameRaw,
        eventDate: submission.eventDate,
        discipline: submission.discipline,
        distanceLabel: submission.distanceLabel,
      }),
    ),
  );

  const relatedSubmissions = await Promise.all(
    submissions.map((submission) =>
      prisma.resultSubmission.findMany({
        where: {
          athleteId: submission.athleteId,
          eventNameRaw: submission.eventNameRaw,
          eventDate: submission.eventDate,
          discipline: submission.discipline,
          distanceLabel: submission.distanceLabel,
          NOT: {
            id: submission.id,
          },
        },
        select: {
          id: true,
          status: true,
          finishTimeRaw: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ),
  );

  return submissions.map((submission, index) => ({
    ...submission,
    matchedEvent: eventMatches[index],
    moderationSummary: {
      hasProtocolUrl: Boolean(submission.protocolUrl),
      claimedAgeGroupMatchesProfile: submission.athlete.seasonAgeGroup
        ? submission.athlete.seasonAgeGroup === submission.ageGroupClaimed
        : true,
      profileAgeGroup: submission.athlete.seasonAgeGroup,
      relatedSubmissions: relatedSubmissions[index],
      matchedEventCategoryLabel: eventMatches[index]?.category?.label ?? null,
      matchedEventCategoryKey: eventMatches[index]?.category?.categoryKey ?? null,
      suggestedFifthPlaceTimeSeconds:
        eventMatches[index]?.protocolGroups.find(
          (group) =>
            group.groupKey === submission.ageGroupClaimed ||
            group.label === submission.ageGroupClaimed,
        )?.fifthPlaceTimeSeconds ?? null,
    },
  }));
}

async function recalculateSeasonRanking(seasonId: string) {
  const verified = await prisma.verifiedResult.findMany({
    where: {
      seasonId,
      status: EntityStatus.ACTIVE,
      athlete: { status: EntityStatus.ACTIVE },
    },
    include: {
      athlete: true,
    },
    orderBy: [{ athleteId: "asc" }, { awardedPoints: "desc" }],
  });

  const grouped = new Map<
    string,
    {
      athleteId: string;
      gender: Gender;
      bestScores: number[];
      verifiedResultsCount: number;
    }
  >();

  for (const item of verified) {
    const bucket = grouped.get(item.athleteId) ?? {
      athleteId: item.athleteId,
      gender: item.athlete.gender,
      bestScores: [],
      verifiedResultsCount: 0,
    };

    bucket.verifiedResultsCount += 1;

    if (bucket.bestScores.length < 3) {
      bucket.bestScores.push(item.awardedPoints);
    }

    grouped.set(item.athleteId, bucket);
  }

  const leaderboard = Array.from(grouped.values())
    .map((entry) => ({
      athleteId: entry.athleteId,
      gender: entry.gender,
      bestScores: [
        entry.bestScores[0] ?? 0,
        entry.bestScores[1] ?? 0,
        entry.bestScores[2] ?? 0,
      ],
      scoredResultsCount: entry.verifiedResultsCount,
      totalPoints: entry.bestScores.reduce((sum, score) => sum + score, 0),
    }))
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      for (let index = 0; index < 3; index += 1) {
        if (right.bestScores[index] !== left.bestScores[index]) {
          return right.bestScores[index] - left.bestScores[index];
        }
      }

      return right.scoredResultsCount - left.scoredResultsCount;
    });

  await prisma.rankingEntry.deleteMany({
    where: { seasonId },
  });

  for (const gender of [Gender.MALE, Gender.FEMALE]) {
    const genderLeaderboard = leaderboard.filter((entry) => entry.gender === gender);
    let previousEntry:
      | {
          totalPoints: number;
          bestScores: number[];
          scoredResultsCount: number;
          rank: number;
        }
      | undefined;

    for (const [index, entry] of genderLeaderboard.entries()) {
      const rank =
        previousEntry &&
        previousEntry.totalPoints === entry.totalPoints &&
        previousEntry.bestScores.every(
          (score, scoreIndex) => score === entry.bestScores[scoreIndex],
        ) &&
        previousEntry.scoredResultsCount === entry.scoredResultsCount
          ? previousEntry.rank
          : index + 1;

      await prisma.rankingEntry.create({
        data: {
          athleteId: entry.athleteId,
          seasonId,
          totalPoints: entry.totalPoints,
          rank,
          scoredResultsCount: entry.scoredResultsCount,
        },
      });

      previousEntry = {
        totalPoints: entry.totalPoints,
        bestScores: entry.bestScores,
        scoredResultsCount: entry.scoredResultsCount,
        rank,
      };
    }
  }
}

export async function reviewSubmission(
  submissionId: string,
  decision: "approve" | "reject",
  notes: string,
  scoringInput?: {
    categoryKey: string;
    fifthPlaceTime: string;
    eventLocation?: string;
    placementOverall?: string;
    placementInAgeGroup?: string;
    moderationFlags?: {
      confirmNoPublicProtocol: boolean;
      confirmMergedAgeGroups: boolean;
      confirmLessThanFiveFinishers: boolean;
    };
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

  if (
    decision === "approve" &&
    submissionBefore.submissionType === SubmissionType.CREATE
  ) {
    const existingVerifiedDuplicate = await findDuplicateSubmission({
      athleteId: submissionBefore.athleteId,
      seasonId: submissionBefore.seasonId,
      eventNameRaw: submissionBefore.eventNameRaw,
      eventDate: submissionBefore.eventDate,
      discipline: submissionBefore.discipline,
      distanceLabel: submissionBefore.distanceLabel,
      finishTimeSeconds: submissionBefore.finishTimeSeconds,
      excludeSubmissionId: submissionBefore.id,
      statuses: [SubmissionStatus.VERIFIED],
    });

    if (existingVerifiedDuplicate) {
      throw new Error("DUPLICATE_VERIFIED_SUBMISSION");
    }
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

  if (
    decision === "approve" &&
    submissionBefore.submissionType !== SubmissionType.DELETE
  ) {
    const matchedEvent = await findEventByFingerprint({
      eventName: submissionBefore.eventNameRaw,
      eventDate: submissionBefore.eventDate,
      discipline: submissionBefore.discipline,
      distanceLabel: submissionBefore.distanceLabel,
    });
    const protocolBenchmark = matchedEvent?.protocolGroups.find(
      (group) =>
        group.groupKey === submissionBefore.ageGroupClaimed ||
        group.label === submissionBefore.ageGroupClaimed,
    )?.fifthPlaceTimeSeconds;
    const benchmarkInput =
      scoringInput?.fifthPlaceTime ||
      (protocolBenchmark ? String(protocolBenchmark) : "");

    if (!scoringInput?.categoryKey || !benchmarkInput) {
      throw new Error("SCORING_INPUT_REQUIRED");
    }

    const requiresManualReason =
      !(submissionBefore.protocolUrl || matchedEvent?.sourceUrl) ||
      scoringInput.moderationFlags?.confirmNoPublicProtocol ||
      scoringInput.moderationFlags?.confirmMergedAgeGroups ||
      scoringInput.moderationFlags?.confirmLessThanFiveFinishers;

    if (requiresManualReason && !notes.trim()) {
      throw new Error("MANUAL_REVIEW_REASON_REQUIRED");
    }

    const fifthPlaceTimeSeconds = protocolBenchmark
      ? protocolBenchmark
      : parseTimeToSeconds(benchmarkInput);

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
      placementOverall: scoringInput?.placementOverall
        ? Number.parseInt(scoringInput.placementOverall, 10)
        : submissionBefore.placementOverall,
      placementInAgeGroup: scoringInput?.placementInAgeGroup
        ? Number.parseInt(scoringInput.placementInAgeGroup, 10)
        : submissionBefore.placementInAgeGroup,
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

  if (
    decision === "approve" &&
    submission.submissionType === SubmissionType.DELETE
  ) {
    if (!submission.targetVerifiedResultId) {
      throw new Error("TARGET_VERIFIED_RESULT_REQUIRED");
    }

    await prisma.verifiedResult.update({
      where: { id: submission.targetVerifiedResultId },
      data: {
        status: EntityStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
    await recalculateSeasonRanking(submission.seasonId);
  } else if (decision === "approve") {
    if (!preparedApproval) {
      throw new Error("APPROVAL_NOT_PREPARED");
    }

    const event = await ensureEventForSubmission({
      eventName: submission.eventNameRaw,
      eventDate: submission.eventDate,
      discipline: submission.discipline,
      distanceLabel: submission.distanceLabel,
      sourceUrl: submission.protocolUrl ?? null,
      location: scoringInput?.eventLocation ?? null,
      categoryId: preparedApproval.eventCategory?.id,
    });

    await prisma.resultSubmission.update({
      where: { id: submission.id },
      data: {
        eventId: event.id,
      },
    });

    if (
      submission.submissionType === SubmissionType.UPDATE &&
      submission.targetVerifiedResultId
    ) {
      await prisma.verifiedResult.update({
        where: { id: submission.targetVerifiedResultId },
        data: {
          status: EntityStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      });
    }

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
        status: EntityStatus.ACTIVE,
        archivedAt: null,
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
        status: EntityStatus.ACTIVE,
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
        moderationFlags: scoringInput?.moderationFlags ?? null,
      },
    },
  });

  await notifyAthleteById(
    submission.athleteId,
    decision === "approve"
      ? submission.submissionType === SubmissionType.DELETE
        ? "Ваш запрос на удаление результата подтверждён. Рейтинг пересчитан."
        : submission.submissionType === SubmissionType.UPDATE
          ? "Изменение результата подтверждено. Рейтинг пересчитан."
          : "Результат подтверждён и добавлен в рейтинг."
      : "Заявка отклонена администратором. Подробности доступны в разделе «Мои результаты».",
  );

  return submission;
}

function compareRankingEntries(
  left: {
    totalPoints: number;
    scoredResultsCount: number;
    athleteId: string;
    athlete: {
      verifiedResults: { awardedPoints: number }[];
    };
  },
  right: {
    totalPoints: number;
    scoredResultsCount: number;
    athleteId: string;
    athlete: {
      verifiedResults: { awardedPoints: number }[];
    };
  },
) {
  if (right.totalPoints !== left.totalPoints) {
    return right.totalPoints - left.totalPoints;
  }

  for (let index = 0; index < 3; index += 1) {
    const leftScore = left.athlete.verifiedResults[index]?.awardedPoints ?? 0;
    const rightScore = right.athlete.verifiedResults[index]?.awardedPoints ?? 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }
  }

  if (right.scoredResultsCount !== left.scoredResultsCount) {
    return right.scoredResultsCount - left.scoredResultsCount;
  }

  return left.athleteId.localeCompare(right.athleteId);
}

function sameRankingScore(
  left: {
    totalPoints: number;
    scoredResultsCount: number;
    athlete: { verifiedResults: { awardedPoints: number }[] };
  },
  right: {
    totalPoints: number;
    scoredResultsCount: number;
    athlete: { verifiedResults: { awardedPoints: number }[] };
  },
) {
  return (
    left.totalPoints === right.totalPoints &&
    left.scoredResultsCount === right.scoredResultsCount &&
    [0, 1, 2].every(
      (index) =>
        (left.athlete.verifiedResults[index]?.awardedPoints ?? 0) ===
        (right.athlete.verifiedResults[index]?.awardedPoints ?? 0),
    )
  );
}

function applyDisplayRanks<
  T extends {
    rank: number;
    totalPoints: number;
    scoredResultsCount: number;
    athleteId: string;
    athlete: {
      verifiedResults: { awardedPoints: number }[];
    };
  },
>(entries: T[]) {
  const sorted = [...entries].sort(compareRankingEntries);
  let previousEntry: T | undefined;
  let previousRank = 0;

  return sorted.map((entry, index) => {
    const rank =
      previousEntry && sameRankingScore(previousEntry, entry)
        ? previousRank
        : index + 1;

    previousEntry = entry;
    previousRank = rank;

    return {
      ...entry,
      rank,
    };
  });
}

const getCachedLeaderboardSnapshot = unstable_cache(
  async () => {
    await ensureDatabaseReady();

    const season = await findCurrentSeason();

    if (!season) {
      return [];
    }

    return prisma.rankingEntry.findMany({
      where: {
        seasonId: season.id,
      },
      include: {
        athlete: {
          include: {
            verifiedResults: {
              where: { seasonId: season.id },
              orderBy: { awardedPoints: "desc" },
              take: 3,
              include: {
                submission: true,
                scoreRule: true,
              },
            },
          },
        },
      },
      orderBy: { rank: "asc" },
    });
  },
  ["public-leaderboard-snapshot-v1"],
  {
    revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
    tags: [PUBLIC_DATA_CACHE_TAG],
  },
);

export async function listLeaderboard(filters?: {
  discipline?: string;
  ageGroup?: string;
  gender?: string;
}) {
  await ensureDatabaseReady();
  const entries = await getCachedLeaderboardSnapshot();

  const genderFilteredEntries = entries.filter((entry) => {
    if (!filters?.gender || filters.gender === "all") {
      return true;
    }

    return (
      (filters.gender === "male" && entry.athlete.gender === Gender.MALE) ||
      (filters.gender === "female" && entry.athlete.gender === Gender.FEMALE)
    );
  });
  const rankedEntries =
    filters?.gender && filters.gender !== "all"
      ? applyDisplayRanks(genderFilteredEntries)
      : genderFilteredEntries;

  return rankedEntries.filter((entry) => {
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
  await ensureDatabaseReady();
  const entries = await getCachedLeaderboardSnapshot();

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
    genders: [
      { value: "male", label: "Мужчины" },
      { value: "female", label: "Женщины" },
    ],
  };
}

async function loadPublicAthleteProfile(athleteId: string) {
  await ensureDatabaseReady();

  const season = await findCurrentSeason();

  if (!season) {
    return null;
  }

  const rankingEntry = await prisma.rankingEntry.findFirst({
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
              scoreRule: true,
            },
          },
        },
      },
    },
  });

  if (rankingEntry) {
    return rankingEntry;
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      verifiedResults: {
        where: { seasonId: season.id },
        orderBy: { awardedPoints: "desc" },
        include: {
          submission: true,
          scoreRule: true,
        },
      },
    },
  });

  if (!athlete) {
    return null;
  }

  return {
    id: `athlete-${athlete.id}`,
    athleteId: athlete.id,
    seasonId: season.id,
    totalPoints: 0,
    rank: null,
    scoredResultsCount: athlete.verifiedResults.length,
    snapshotAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    athlete,
  };
}

export async function getPublicAthleteProfile(athleteId: string) {
  return unstable_cache(
    () => loadPublicAthleteProfile(athleteId),
    ["public-athlete-profile-v1", athleteId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: [PUBLIC_DATA_CACHE_TAG],
    },
  )();
}

export async function seedDemoScenario() {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();
  await ensureScoreRuleSeed(season.id);

  const athletes = new Map<string, Awaited<ReturnType<typeof upsertAthleteProfile>>>();

  for (const profile of DEMO_PROFILES) {
    athletes.set(
      profile.email,
      await upsertDemoAthleteProfile(profile),
    );
  }

  for (const item of DEMO_RESULTS) {
    const athleteRef = athletes.get(item.email);

    if (!athleteRef) {
      continue;
    }

    const category = await prisma.eventCategory.findUnique({
      where: {
        discipline_categoryKey: {
          discipline: item.discipline,
          categoryKey: item.categoryKey,
        },
      },
    });
    const scoreRule = await prisma.scoreRule.findFirst({
      where: {
        seasonId: season.id,
        discipline: item.discipline,
        categoryKey: item.categoryKey,
      },
    });

    if (!category || !scoreRule) {
      throw new Error(`DEMO_SCORE_RULE_NOT_FOUND:${item.discipline}:${item.categoryKey}`);
    }

    const eventDate = new Date(`${item.eventDate}T09:00:00.000Z`);
    const finishTimeSeconds = parseTimeToSeconds(item.finishTime);

    if (finishTimeSeconds === null) {
      throw new Error(`DEMO_INVALID_FINISH_TIME:${item.finishTime}`);
    }

    const fifthPlaceTimeSeconds = parseTimeToSeconds(item.fifthPlaceTime);

    if (fifthPlaceTimeSeconds === null) {
      throw new Error(`DEMO_INVALID_FIFTH_PLACE_TIME:${item.fifthPlaceTime}`);
    }

    const event = await upsertDemoEvent({
      eventName: item.eventName,
      eventDate,
      discipline: item.discipline,
      distanceLabel: item.distanceLabel,
      protocolUrl: item.protocolUrl,
      categoryId: category.id,
    });

    const submission = await upsertDemoSubmission({
      athleteId: athleteRef.athlete.id,
      seasonId: season.id,
      eventId: event.id,
      eventName: item.eventName,
      eventDate,
      discipline: item.discipline,
      distanceLabel: item.distanceLabel,
      ageGroupClaimed: item.ageGroupClaimed,
      finishTime: item.finishTime,
      finishTimeSeconds,
      protocolUrl: item.protocolUrl,
    });

    const lagPercent = calculateLagPercent(
      finishTimeSeconds,
      fifthPlaceTimeSeconds,
    );
    const awardedPoints = calculatePoints(scoreRule.basePoints, lagPercent);

    await prisma.verifiedResult.upsert({
      where: {
        submissionId: submission.id,
      },
      update: {
        athleteId: athleteRef.athlete.id,
        seasonId: season.id,
        eventId: event.id,
        eventCategoryId: category.id,
        ageGroupUsed: item.ageGroupClaimed,
        fifthPlaceTimeSeconds,
        lagPercent: new Prisma.Decimal(lagPercent),
        awardedPoints,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: scoreRule.id,
      },
      create: {
        athleteId: athleteRef.athlete.id,
        seasonId: season.id,
        submissionId: submission.id,
        eventId: event.id,
        eventCategoryId: category.id,
        ageGroupUsed: item.ageGroupClaimed,
        fifthPlaceTimeSeconds,
        lagPercent: new Prisma.Decimal(lagPercent),
        awardedPoints,
        verificationMode: VerificationMode.MANUAL,
        scoreRuleId: scoreRule.id,
      },
    });
  }

  await recalculateSeasonRanking(season.id);

  return listLeaderboard();
}

function getAthleteDisplayName(athlete: {
  firstName: string;
  lastName: string;
  publicDisplayName?: string | null;
}) {
  return athlete.publicDisplayName?.trim() || `${athlete.firstName} ${athlete.lastName}`.trim();
}

async function createResultSubmissionForAthlete(
  athleteId: string,
  input: ResultSubmissionInput,
) {
  const season = await ensureCurrentSeason();
  const eventDate = new Date(input.eventDate);
  const finishTimeSeconds = parseTimeToSeconds(input.finishTime);

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  const existingDuplicate = await findDuplicateSubmission({
    athleteId,
    seasonId: season.id,
    eventNameRaw: input.eventName,
    eventDate,
    discipline: input.discipline as Discipline,
    distanceLabel: input.distanceLabel,
    finishTimeSeconds,
    statuses: [
      SubmissionStatus.PENDING_MANUAL_REVIEW,
      SubmissionStatus.VERIFIED,
    ],
  });

  if (existingDuplicate) {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId,
      seasonId: season.id,
      eventNameRaw: input.eventName,
      eventDate,
      discipline: input.discipline as Discipline,
      distanceLabel: input.distanceLabel,
      ageGroupClaimed: input.ageGroupClaimed,
      finishTimeRaw: input.finishTime,
      finishTimeSeconds,
      protocolUrl: input.protocolUrl || null,
      placementOverall: input.placementOverall
        ? Number.parseInt(input.placementOverall, 10)
        : null,
      placementInAgeGroup: input.placementInAgeGroup
        ? Number.parseInt(input.placementInAgeGroup, 10)
        : null,
      comment: input.comment || null,
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    },
  });
}

async function resetSubmissionToReview(
  submissionId: string,
  athleteId: string,
  seasonId: string,
  input: ResultSubmissionInput,
) {
  const current = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
    include: { verifiedResult: true },
  });

  if (!current || current.athleteId !== athleteId) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  const eventDate = new Date(input.eventDate);
  const finishTimeSeconds = parseTimeToSeconds(input.finishTime);

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  const existingDuplicate = await findDuplicateSubmission({
    athleteId,
    seasonId,
    eventNameRaw: input.eventName,
    eventDate,
    discipline: input.discipline as Discipline,
    distanceLabel: input.distanceLabel,
    finishTimeSeconds,
    excludeSubmissionId: submissionId,
    statuses: current.verifiedResult
      ? [SubmissionStatus.PENDING_MANUAL_REVIEW]
      : [
          SubmissionStatus.PENDING_MANUAL_REVIEW,
          SubmissionStatus.VERIFIED,
        ],
  });

  if (existingDuplicate) {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  const commonData = {
      eventId: current.eventId,
      eventNameRaw: input.eventName,
      eventDate,
      discipline: input.discipline as Discipline,
      distanceLabel: input.distanceLabel,
      ageGroupClaimed: input.ageGroupClaimed,
      finishTimeRaw: input.finishTime,
      finishTimeSeconds,
      protocolUrl: input.protocolUrl || null,
      placementOverall: input.placementOverall
        ? Number.parseInt(input.placementOverall, 10)
        : null,
      placementInAgeGroup: input.placementInAgeGroup
        ? Number.parseInt(input.placementInAgeGroup, 10)
        : null,
      comment: input.comment || null,
      adminNotes: null,
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    };

  if (current.verifiedResult) {
    await prisma.resultSubmission.create({
      data: {
        athleteId,
        seasonId,
        submissionType: SubmissionType.UPDATE,
        targetVerifiedResultId: current.verifiedResult.id,
        ...commonData,
      },
    });
    return;
  }

  await prisma.resultSubmission.update({
    where: { id: submissionId },
    data: commonData,
  });
}

export async function updateAthletePublicProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    middleName: string;
    city: string;
    publicDisplayName: string;
    showPublicResults: boolean;
  },
) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
  });

  if (!athlete) {
    throw new Error("ATHLETE_NOT_FOUND");
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const middleName = input.middleName.trim();
  const city = input.city.trim();
  const publicDisplayName = input.publicDisplayName.trim();

  if (!firstName || !lastName || !city) {
    throw new Error("PROFILE_FIELDS_REQUIRED");
  }

  return prisma.athlete.update({
    where: { id: athlete.id },
    data: {
      firstName,
      lastName,
      middleName: middleName || null,
      city,
      publicDisplayName: publicDisplayName || `${firstName} ${lastName}`.trim(),
      showPublicResults: input.showPublicResults,
    },
  });
}

export async function deleteAthleteAccount(userId: string) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
    include: { verifiedResults: { select: { seasonId: true } } },
  });

  if (!athlete) throw new Error("ATHLETE_NOT_FOUND");

  await prisma.$transaction([
    prisma.athlete.update({
      where: { id: athlete.id },
      data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
    }),
    prisma.verifiedResult.updateMany({
      where: { athleteId: athlete.id, status: EntityStatus.ACTIVE },
      data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
    }),
  ]);

  for (const seasonId of new Set(athlete.verifiedResults.map((item) => item.seasonId))) {
    await recalculateSeasonRanking(seasonId);
  }

  return athlete;
}

export async function updateSubmissionForUser(
  userId: string,
  submissionId: string,
  input: ResultSubmissionInput,
) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
  });

  if (!athlete) {
    throw new Error("ATHLETE_NOT_FOUND");
  }

  const submission = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
    include: { verifiedResult: true },
  });

  if (!submission || submission.athleteId !== athlete.id) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  await resetSubmissionToReview(submission.id, athlete.id, submission.seasonId, input);
}

export async function deleteSubmissionForUser(userId: string, submissionId: string) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { userId },
  });

  if (!athlete) {
    throw new Error("ATHLETE_NOT_FOUND");
  }

  const submission = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
    include: { verifiedResult: true },
  });

  if (!submission || submission.athleteId !== athlete.id) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  if (submission.verifiedResult) {
    await prisma.resultSubmission.create({
      data: {
        athleteId: submission.athleteId,
        seasonId: submission.seasonId,
        eventId: submission.eventId,
        submissionType: SubmissionType.DELETE,
        targetVerifiedResultId: submission.verifiedResult.id,
        eventNameRaw: submission.eventNameRaw,
        eventDate: submission.eventDate,
        discipline: submission.discipline,
        distanceLabel: submission.distanceLabel,
        ageGroupClaimed: submission.ageGroupClaimed,
        finishTimeRaw: submission.finishTimeRaw,
        finishTimeSeconds: submission.finishTimeSeconds,
        protocolUrl: submission.protocolUrl,
        comment: "Запрос на удаление подтвержденного результата",
        status: SubmissionStatus.PENDING_MANUAL_REVIEW,
      },
    });
  } else {
    await prisma.resultSubmission.delete({ where: { id: submissionId } });
  }
}

export async function listEvents() {
  await ensureDatabaseReady();

  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          protocolRows: true,
          verifiedResults: true,
        },
      },
      category: true,
    },
    orderBy: [{ eventDate: "desc" }, { name: "asc" }],
  });

  return events.map((event) => ({
    ...event,
    isPast: event.eventDate < new Date(),
    participantsCount: event._count.verifiedResults,
    protocolRowsCount: event._count.protocolRows,
  }));
}

const getCachedPublicEventList = unstable_cache(
  async () => {
    await ensureDatabaseReady();

    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        eventDate: true,
        discipline: true,
        distanceLabel: true,
        sourceUrl: true,
        location: true,
        _count: {
          select: {
            protocolRows: true,
            verifiedResults: true,
          },
        },
      },
      orderBy: [{ eventDate: "desc" }, { name: "asc" }],
    });

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      eventDate: event.eventDate.toISOString(),
      discipline: event.discipline,
      distanceLabel: event.distanceLabel,
      sourceUrl: event.sourceUrl,
      location: event.location,
      participantsCount: event._count.verifiedResults,
      protocolRowsCount: event._count.protocolRows,
    }));
  },
  ["public-event-list-v1"],
  {
    revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
    tags: [PUBLIC_DATA_CACHE_TAG],
  },
);

function getEventGroupKey(event: {
  name: string;
  eventDate: Date;
  discipline: Discipline;
  location?: string | null;
}) {
  return [
    event.name.trim().toLowerCase(),
    event.eventDate.toISOString(),
    event.discipline,
    event.location?.trim().toLowerCase() ?? "",
  ].join("|");
}

export async function listPublicEventCards(filters?: { discipline?: string }) {
  const cachedEvents = await getCachedPublicEventList();
  const events = cachedEvents.map((event) => ({
    ...event,
    eventDate: new Date(event.eventDate),
    isPast: new Date(event.eventDate) < new Date(),
  }));
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      eventDate: Date;
      discipline: Discipline;
      location: string | null;
      isPast: boolean;
      distances: string[];
      participantsCount: number;
      protocolRowsCount: number;
      hasProtocolUrl: boolean;
    }
  >();

  for (const event of events) {
    if (
      filters?.discipline &&
      filters.discipline !== "all" &&
      event.discipline !== filters.discipline
    ) {
      continue;
    }

    const key = getEventGroupKey(event);
    const group = groups.get(key);

    if (!group) {
      groups.set(key, {
        id: event.id,
        name: event.name,
        eventDate: event.eventDate,
        discipline: event.discipline,
        location: event.location,
        isPast: event.isPast,
        distances: [event.distanceLabel],
        participantsCount: event.participantsCount,
        protocolRowsCount: event.protocolRowsCount,
        hasProtocolUrl: Boolean(event.sourceUrl),
      });
      continue;
    }

    group.distances.push(event.distanceLabel);
    group.participantsCount += event.participantsCount;
    group.protocolRowsCount += event.protocolRowsCount;
    group.hasProtocolUrl = group.hasProtocolUrl || Boolean(event.sourceUrl);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    distances: Array.from(new Set(group.distances)).sort(),
  }));
}

async function loadPublicEventCard(eventId: string) {
  await ensureDatabaseReady();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      category: true,
      _count: {
        select: {
          protocolRows: true,
        },
      },
      verifiedResults: {
        include: {
          athlete: true,
          submission: true,
          scoreRule: true,
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  const relatedEvents = await prisma.event.findMany({
    where: {
      name: event.name,
      eventDate: event.eventDate,
      discipline: event.discipline,
      location: event.location,
    },
    include: {
      category: true,
      _count: {
        select: {
          protocolRows: true,
        },
      },
      verifiedResults: {
        include: {
          athlete: true,
          submission: true,
          scoreRule: true,
        },
      },
    },
    orderBy: { distanceLabel: "asc" },
  });

  const distances = relatedEvents.map((relatedEvent) => {
    const participants = [...relatedEvent.verifiedResults].sort((left, right) => {
      const leftPlace =
        left.submission.placementOverall ?? Number.MAX_SAFE_INTEGER;
      const rightPlace =
        right.submission.placementOverall ?? Number.MAX_SAFE_INTEGER;

      if (leftPlace !== rightPlace) {
        return leftPlace - rightPlace;
      }

      return right.awardedPoints - left.awardedPoints;
    });

    return {
      id: relatedEvent.id,
      distanceLabel: relatedEvent.distanceLabel,
      category: relatedEvent.category,
      sourceUrl: relatedEvent.sourceUrl,
      protocolRowsCount: relatedEvent._count.protocolRows,
      participants: participants.map((result) => ({
        ...result,
        athleteDisplayName: getAthleteDisplayName(result.athlete),
      })),
    };
  });

  const currentDistance =
    distances.find((distance) => distance.id === event.id) ?? distances[0];

  return {
    ...event,
    isPast: event.eventDate < new Date(),
    protocolRowsCount: distances.reduce(
      (sum, distance) => sum + distance.protocolRowsCount,
      0,
    ),
    distances,
    participants: currentDistance?.participants ?? [],
  };
}

export async function getPublicEventCard(eventId: string) {
  const event = await unstable_cache(
    () => loadPublicEventCard(eventId),
    ["public-event-card-v1", eventId],
    {
      revalidate: PUBLIC_DATA_REVALIDATE_SECONDS,
      tags: [PUBLIC_DATA_CACHE_TAG],
    },
  )();

  if (!event) {
    return null;
  }

  return {
    ...event,
    eventDate: new Date(event.eventDate),
  };
}

export async function createAdminManagedEvent(input: {
  name: string;
  eventDate: string;
  discipline: Discipline;
  distanceLabel: string;
  location: string;
  protocolUrl: string;
  categoryKey?: string;
}) {
  await ensureDatabaseReady();

  const eventCategory = input.categoryKey
    ? await prisma.eventCategory.findFirst({
        where: {
          discipline: input.discipline,
          categoryKey: input.categoryKey,
        },
      })
    : null;

  const event = await ensureEventForSubmission({
    eventName: input.name.trim(),
    eventDate: new Date(`${input.eventDate}T09:00:00.000Z`),
    discipline: input.discipline,
    distanceLabel: input.distanceLabel.trim(),
    location: input.location.trim(),
    sourceUrl: input.protocolUrl.trim(),
    categoryId: eventCategory?.id ?? null,
  });

  await importProtocolForEvent({
    eventId: event.id,
    sourceUrl: event.sourceUrl,
    eventName: event.name,
    eventDate: event.eventDate,
    location: event.location,
    distanceLabel: event.distanceLabel,
  });

  return event;
}

export async function updateAdminManagedEvent(
  eventId: string,
  input: {
    name: string;
    eventDate: string;
    discipline: Discipline;
    distanceLabel: string;
    location: string;
    protocolUrl: string;
    categoryKey?: string;
  },
) {
  await ensureDatabaseReady();

  const eventCategory = input.categoryKey
    ? await prisma.eventCategory.findFirst({
        where: {
          discipline: input.discipline,
          categoryKey: input.categoryKey,
        },
      })
    : null;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      name: input.name.trim(),
      eventDate: new Date(`${input.eventDate}T09:00:00.000Z`),
      discipline: input.discipline,
      distanceLabel: input.distanceLabel.trim(),
      location: input.location.trim() || null,
      sourceUrl: input.protocolUrl.trim() || null,
      categoryId: eventCategory?.id ?? null,
    },
  });

  await importProtocolForEvent({
    eventId: event.id,
    sourceUrl: event.sourceUrl,
    eventName: event.name,
    eventDate: event.eventDate,
    location: event.location,
    distanceLabel: event.distanceLabel,
  });

  return event;
}

export async function deleteAdminManagedEvent(eventId: string) {
  await ensureDatabaseReady();

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
  });

  if (event.competitionId) {
    const activeDistances = await prisma.event.count({
      where: {
        competitionId: event.competitionId,
        status: EntityStatus.ACTIVE,
      },
    });
    if (activeDistances === 0) {
      await prisma.competition.update({
        where: { id: event.competitionId },
        data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
      });
    }
  }

  return event;
}

export async function listAthletesForAdmin() {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();
  const athletes = await prisma.athlete.findMany({
    include: {
      user: true,
      clubs: { include: { club: true } },
      coaches: { include: { coach: true } },
      rankingEntries: {
        where: { seasonId: season.id },
      },
      _count: {
        select: {
          submissions: true,
          verifiedResults: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return athletes.map((athlete) => ({
    ...athlete,
    displayName: getAthleteDisplayName(athlete),
    rankingEntry: athlete.rankingEntries[0] ?? null,
  }));
}

export async function getAdminAthleteDetail(athleteId: string) {
  await ensureDatabaseReady();

  const season = await ensureCurrentSeason();

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: true,
      clubs: { include: { club: true } },
      coaches: { include: { coach: true } },
      submissions: {
        include: {
          verifiedResult: {
            include: {
              scoreRule: true,
            },
          },
          event: true,
        },
        orderBy: { eventDate: "desc" },
      },
      rankingEntries: {
        where: { seasonId: season.id },
      },
      verifiedResults: {
        where: { seasonId: season.id },
      },
    },
  });

  if (!athlete) {
    return null;
  }

  return {
    ...athlete,
    displayName: getAthleteDisplayName(athlete),
    rankingEntry: athlete.rankingEntries[0] ?? null,
  };
}

export async function setAthleteArchiveStatusByAdmin(
  athleteId: string,
  restore: boolean,
) {
  await ensureDatabaseReady();

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: {
      verifiedResults: {
        where: { status: EntityStatus.ACTIVE },
        select: { seasonId: true },
      },
    },
  });

  if (!athlete) {
    throw new Error("ATHLETE_NOT_FOUND");
  }

  await prisma.athlete.update({
    where: { id: athleteId },
    data: {
      status: restore ? EntityStatus.ACTIVE : EntityStatus.ARCHIVED,
      archivedAt: restore ? null : new Date(),
    },
  });

  for (const seasonId of new Set(athlete.verifiedResults.map((item) => item.seasonId))) {
    await recalculateSeasonRanking(seasonId);
  }
}

export async function updateAthleteByAdmin(
  athleteId: string,
  input: {
    firstName: string;
    lastName: string;
    middleName: string;
    city: string;
    seasonAgeGroup: string;
    publicDisplayName: string;
    showPublicResults: boolean;
    birthDate?: string;
    gender?: Gender;
    telegramUsername?: string;
    showTelegramProfile?: boolean;
    clubIds?: string[];
    coachIds?: string[];
  },
) {
  await ensureDatabaseReady();

  return prisma.$transaction(async (tx) => {
    const athlete = await tx.athlete.update({
      where: { id: athleteId },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        middleName: input.middleName.trim() || null,
        city: input.city.trim() || null,
        seasonAgeGroup: input.seasonAgeGroup.trim() || null,
        publicDisplayName: input.publicDisplayName.trim() || null,
        showPublicResults: input.showPublicResults,
        birthDate: input.birthDate
          ? new Date(`${input.birthDate}T00:00:00.000Z`)
          : undefined,
        gender: input.gender,
        telegramUsername: input.telegramUsername?.trim() || null,
        showTelegramProfile: input.showTelegramProfile,
      },
    });

    if (input.clubIds) {
      await tx.athleteClub.deleteMany({ where: { athleteId } });
      if (input.clubIds.length) {
        await tx.athleteClub.createMany({
          data: input.clubIds.map((clubId) => ({ athleteId, clubId })),
        });
      }
    }

    if (input.coachIds) {
      await tx.athleteCoach.deleteMany({ where: { athleteId } });
      if (input.coachIds.length) {
        await tx.athleteCoach.createMany({
          data: input.coachIds.map((coachId) => ({ athleteId, coachId })),
        });
      }
    }

    return athlete;
  });
}

export async function createAthleteByAdmin(profile: AdminAthleteProfile) {
  await ensureDatabaseReady();

  const user = await prisma.user.create({
    data: {
      role: UserRole.ATHLETE,
    },
  });

  const athlete = await prisma.athlete.create({
    data: {
      userId: user.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: null,
      publicDisplayName:
        profile.publicDisplayName ||
        `${profile.firstName} ${profile.lastName}`.trim(),
      showPublicResults: profile.showPublicResults,
      birthDate: new Date(profile.birthDate),
      gender: profile.gender === "male" ? Gender.MALE : Gender.FEMALE,
      city: profile.city,
      seasonAgeGroup: profile.seasonAgeGroup,
      telegramUsername: profile.telegramUsername || null,
      showTelegramProfile: false,
    },
  });

  return { user, athlete };
}

export async function createAdminAccount(email: string, password: string) {
  await ensureDatabaseReady();

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || password.trim().length < 8) {
    throw new Error("ADMIN_CREDENTIALS_INVALID");
  }

  const passwordHash = await createPasswordHash(password.trim());

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      role: UserRole.ADMIN,
      passwordHash,
    },
    create: {
      email: normalizedEmail,
      role: UserRole.ADMIN,
      passwordHash,
    },
  });
}

export async function listAdminUsers() {
  await ensureDatabaseReady();

  return prisma.user.findMany({
    where: { role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSubmissionByAdmin(
  athleteId: string,
  input: ResultSubmissionInput,
) {
  await ensureDatabaseReady();
  const categoryKey = input.fifthPlaceTime?.trim()
    ? await resolveAdminScoringCategoryKey(input)
    : null;

  if (input.fifthPlaceTime?.trim() && !categoryKey) {
    throw new Error("SCORING_CATEGORY_REQUIRED");
  }

  const submission = await createResultSubmissionForAthlete(athleteId, input);

  if (input.fifthPlaceTime?.trim() && categoryKey) {
    await reviewSubmission(
      submission.id,
      "approve",
      input.comment || "Ручной расчет из карточки спортсмена.",
      {
        categoryKey,
        fifthPlaceTime: input.fifthPlaceTime,
        placementOverall: input.placementOverall,
        placementInAgeGroup: input.placementInAgeGroup,
        moderationFlags: {
          confirmNoPublicProtocol: true,
          confirmMergedAgeGroups: false,
          confirmLessThanFiveFinishers: false,
        },
      },
    );
  }

  return submission;
}

export async function updateSubmissionByAdmin(
  submissionId: string,
  input: ResultSubmissionInput,
) {
  await ensureDatabaseReady();

  const submission = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
    include: {
      verifiedResult: {
        include: {
          scoreRule: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  const categoryKey = input.fifthPlaceTime?.trim()
    ? await resolveAdminScoringCategoryKey(
        input,
        submission.verifiedResult?.scoreRule.categoryKey,
      )
    : null;

  if (input.fifthPlaceTime?.trim() && !categoryKey) {
    throw new Error("SCORING_CATEGORY_REQUIRED");
  }

  await resetSubmissionToReview(
    submission.id,
    submission.athleteId,
    submission.seasonId,
    input,
  );

  if (input.fifthPlaceTime?.trim() && categoryKey) {
    await reviewSubmission(
      submission.id,
      "approve",
      input.comment || "Ручной перерасчет из карточки спортсмена.",
      {
        categoryKey,
        fifthPlaceTime: input.fifthPlaceTime,
        placementOverall: input.placementOverall,
        placementInAgeGroup: input.placementInAgeGroup,
        moderationFlags: {
          confirmNoPublicProtocol: true,
          confirmMergedAgeGroups: false,
          confirmLessThanFiveFinishers: false,
        },
      },
    );
  }
}

export async function deleteSubmissionByAdmin(submissionId: string) {
  await ensureDatabaseReady();

  const submission = await prisma.resultSubmission.findUnique({
    where: { id: submissionId },
    include: { verifiedResult: true },
  });

  if (!submission) {
    throw new Error("SUBMISSION_NOT_FOUND");
  }

  if (submission.verifiedResult) {
    await prisma.verifiedResult.update({
      where: { id: submission.verifiedResult.id },
      data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
    });
    await prisma.resultSubmission.update({
      where: { id: submissionId },
      data: { adminNotes: "Архивировано администратором" },
    });
  } else {
    await prisma.resultSubmission.delete({ where: { id: submissionId } });
  }
  await recalculateSeasonRanking(submission.seasonId);
}
