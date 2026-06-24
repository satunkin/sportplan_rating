import {
  EntityStatus,
  Gender,
  Prisma,
  ProposalStatus,
  ProposalType,
  SeasonStatus,
  SubmissionStatus,
  SubmissionType,
} from "@prisma/client";

import {
  CYCLON_SEASON_YEAR,
  getDefaultAgeGroup,
  getSeasonAge,
} from "@/lib/age-group";
import { prisma } from "@/lib/prisma";
import { importProtocolForEvent } from "@/lib/protocol-import/import-source-protocol";
import { parseTimeToSeconds } from "@/lib/time";

export type TelegramProfileInput = {
  telegramId: string;
  telegramUsername?: string | null;
  chatId: string;
  fullName: string;
  birthDate: string;
  gender: Gender;
  showTelegramProfile: boolean;
};

export type TelegramResultInput = {
  telegramId: string;
  eventId: string;
  finishTime: string;
  fifthPlaceTime?: string | null;
  comment?: string | null;
};

function splitFullName(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts[1] ?? "",
    middleName: parts.slice(2).join(" ") || null,
  };
}

function getDisplayName(athlete: {
  firstName: string;
  lastName: string;
  publicDisplayName: string | null;
}) {
  return (
    athlete.publicDisplayName?.trim() ||
    `${athlete.firstName} ${athlete.lastName}`.trim()
  );
}

async function findActiveTelegramLinkCandidate(params: {
  birthDate: Date;
  firstName: string;
  lastName: string;
}) {
  const baseWhere = {
    birthDate: params.birthDate,
    status: EntityStatus.ACTIVE,
    user: { telegramId: null },
  };

  const exactCandidate = await prisma.athlete.findFirst({
    where: {
      ...baseWhere,
      firstName: { equals: params.firstName, mode: "insensitive" },
      lastName: { equals: params.lastName, mode: "insensitive" },
    },
  });

  if (exactCandidate) {
    return exactCandidate;
  }

  return prisma.athlete.findFirst({
    where: {
      ...baseWhere,
      firstName: { equals: params.lastName, mode: "insensitive" },
      lastName: { equals: params.firstName, mode: "insensitive" },
    },
  });
}

async function ensureCyclonSeason() {
  return prisma.season.upsert({
    where: { name: `${CYCLON_SEASON_YEAR} Season` },
    update: { status: SeasonStatus.ACTIVE },
    create: {
      name: `${CYCLON_SEASON_YEAR} Season`,
      startDate: new Date(`${CYCLON_SEASON_YEAR}-01-01T00:00:00.000Z`),
      endDate: new Date(`${CYCLON_SEASON_YEAR}-12-31T23:59:59.999Z`),
      status: SeasonStatus.ACTIVE,
    },
  });
}

export async function getTelegramAthlete(telegramId: string) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      athlete: {
        include: {
          clubs: { include: { club: true } },
          coaches: { include: { coach: true } },
        },
      },
    },
  });
}

export async function registerTelegramAthlete(input: TelegramProfileInput) {
  const birthDate = new Date(`${input.birthDate}T00:00:00.000Z`);

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("INVALID_BIRTH_DATE");
  }

  const names = splitFullName(input.fullName);

  if (!names.firstName || !names.lastName) {
    throw new Error("INVALID_FULL_NAME");
  }

  const existingTelegramUser = await getTelegramAthlete(input.telegramId);

  if (existingTelegramUser?.athlete) {
    return { status: "linked" as const, user: existingTelegramUser };
  }

  const candidate = await findActiveTelegramLinkCandidate({
    birthDate,
    firstName: names.firstName,
    lastName: names.lastName,
  });

  if (candidate) {
    const request = await prisma.athleteLinkRequest.create({
      data: {
        telegramId: input.telegramId,
        telegramUsername: input.telegramUsername?.trim() || null,
        candidateAthleteId: candidate.id,
        profileJson: {
          chatId: input.chatId,
          fullName: input.fullName,
          birthDate: input.birthDate,
          gender: input.gender,
          showTelegramProfile: input.showTelegramProfile,
        },
      },
    });

    return { status: "pending_link" as const, request };
  }

  const user = await prisma.user.create({
    data: {
      telegramId: input.telegramId,
      athlete: {
        create: {
          firstName: names.firstName,
          lastName: names.lastName,
          middleName: names.middleName,
          birthDate,
          gender: input.gender,
          seasonAgeGroup: getDefaultAgeGroup(birthDate, input.gender),
          telegramUsername: input.telegramUsername?.trim() || null,
          showTelegramProfile: input.showTelegramProfile,
          showPublicResults: true,
        },
      },
    },
    include: { athlete: true },
  });

  return { status: "created" as const, user };
}

export async function listTelegramCompetitions() {
  const competitions = await prisma.competition.findMany({
    where: {
      status: EntityStatus.ACTIVE,
      distances: { some: { status: EntityStatus.ACTIVE } },
    },
    include: {
      series: true,
      distances: {
        where: { status: EntityStatus.ACTIVE },
        orderBy: { distanceLabel: "asc" },
      },
    },
    orderBy: [{ eventDate: "desc" }, { name: "asc" }],
    take: 20,
  });

  return competitions;
}

export async function createTelegramResultSubmission(
  input: TelegramResultInput,
) {
  const user = await prisma.user.findUnique({
    where: { telegramId: input.telegramId },
    include: { athlete: true },
  });

  if (!user?.athlete) {
    throw new Error("TELEGRAM_ATHLETE_NOT_FOUND");
  }

  const event = await prisma.event.findFirst({
    where: {
      id: input.eventId,
      status: EntityStatus.ACTIVE,
      competition: { status: EntityStatus.ACTIVE },
    },
    include: { competition: true },
  });

  if (!event) {
    throw new Error("EVENT_NOT_FOUND");
  }

  const finishTimeSeconds = parseTimeToSeconds(input.finishTime);
  const proposedFifthPlaceTimeSeconds = input.fifthPlaceTime
    ? parseTimeToSeconds(input.fifthPlaceTime)
    : null;

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  if (input.fifthPlaceTime && proposedFifthPlaceTimeSeconds === null) {
    throw new Error("INVALID_FIFTH_PLACE_TIME");
  }

  const season = await ensureCyclonSeason();
  const duplicate = await prisma.resultSubmission.findFirst({
    where: {
      athleteId: user.athlete.id,
      seasonId: season.id,
      eventId: event.id,
      finishTimeSeconds,
      status: {
        in: [
          SubmissionStatus.PENDING_AUTO_CHECK,
          SubmissionStatus.PENDING_MANUAL_REVIEW,
          SubmissionStatus.VERIFIED,
        ],
      },
    },
  });

  if (duplicate) {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId: user.athlete.id,
      seasonId: season.id,
      eventId: event.id,
      submissionType: SubmissionType.CREATE,
      eventNameRaw: event.competition?.name ?? event.name,
      eventDate: event.competition?.eventDate ?? event.eventDate,
      discipline: event.discipline,
      distanceLabel: event.distanceLabel,
      ageGroupClaimed:
        user.athlete.seasonAgeGroup ??
        getDefaultAgeGroup(user.athlete.birthDate, user.athlete.gender),
      finishTimeRaw: input.finishTime,
      finishTimeSeconds,
      proposedFifthPlaceTimeSeconds,
      protocolUrl: event.sourceUrl,
      comment: input.comment?.trim() || null,
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    },
  });
}

export async function createCompetitionProposal(params: {
  telegramId: string;
  name: string;
  date: string;
  distance: string;
  discipline: string;
}) {
  const user = await prisma.user.findUnique({
    where: { telegramId: params.telegramId },
  });

  return prisma.entityProposal.create({
    data: {
      type: ProposalType.COMPETITION,
      proposerUserId: user?.id,
      payloadJson: {
        name: params.name.trim(),
        date: params.date.trim(),
        distance: params.distance.trim(),
        discipline: params.discipline,
      },
    },
  });
}

export async function createDirectoryProposal(params: {
  telegramId: string;
  type: "club" | "coach";
  name: string;
}) {
  const user = await prisma.user.findUnique({
    where: { telegramId: params.telegramId },
  });

  return prisma.entityProposal.create({
    data: {
      type: params.type === "club" ? ProposalType.CLUB : ProposalType.COACH,
      proposerUserId: user?.id,
      payloadJson: { name: params.name.trim() },
    },
  });
}

export async function getTelegramAthleteDashboard(telegramId: string) {
  const season = await ensureCyclonSeason();
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      athlete: {
        include: {
          rankingEntries: { where: { seasonId: season.id } },
          verifiedResults: {
            where: { seasonId: season.id, status: EntityStatus.ACTIVE },
            orderBy: { awardedPoints: "desc" },
            include: { submission: true },
          },
          submissions: {
            where: {
              status: {
                in: [
                  SubmissionStatus.PENDING_AUTO_CHECK,
                  SubmissionStatus.PENDING_MANUAL_REVIEW,
                  SubmissionStatus.REJECTED,
                ],
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          clubs: { include: { club: true } },
          coaches: { include: { coach: true } },
        },
      },
    },
  });

  if (!user?.athlete) {
    return null;
  }

  return {
    athlete: user.athlete,
    displayName: getDisplayName(user.athlete),
    ranking: user.athlete.rankingEntries[0] ?? null,
    seasonAge: getSeasonAge(user.athlete.birthDate),
  };
}

export async function updateTelegramAthleteProfile(params: {
  telegramId: string;
  fullName?: string;
  birthDate?: string;
  gender?: Gender;
  showTelegramProfile?: boolean;
  telegramUsername?: string | null;
}) {
  const user = await prisma.user.findUnique({
    where: { telegramId: params.telegramId },
    include: { athlete: true },
  });

  if (!user?.athlete) {
    throw new Error("TELEGRAM_ATHLETE_NOT_FOUND");
  }

  const names = params.fullName ? splitFullName(params.fullName) : null;
  const birthDate = params.birthDate
    ? new Date(`${params.birthDate}T00:00:00.000Z`)
    : user.athlete.birthDate;
  const gender = params.gender ?? user.athlete.gender;

  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("INVALID_BIRTH_DATE");
  }

  return prisma.athlete.update({
    where: { id: user.athlete.id },
    data: {
      firstName: names?.firstName,
      lastName: names?.lastName,
      middleName: names?.middleName,
      birthDate,
      gender,
      seasonAgeGroup: getDefaultAgeGroup(birthDate, gender),
      telegramUsername:
        params.telegramUsername === undefined
          ? undefined
          : params.telegramUsername?.trim() || null,
      showTelegramProfile: params.showTelegramProfile,
    },
  });
}

export async function createResultChangeRequest(params: {
  telegramId: string;
  verifiedResultId: string;
  type: "update" | "delete";
  finishTime?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { telegramId: params.telegramId },
    include: { athlete: true },
  });

  if (!user?.athlete) {
    throw new Error("TELEGRAM_ATHLETE_NOT_FOUND");
  }

  const result = await prisma.verifiedResult.findFirst({
    where: {
      id: params.verifiedResultId,
      athleteId: user.athlete.id,
      status: EntityStatus.ACTIVE,
    },
    include: { submission: true },
  });

  if (!result) {
    throw new Error("VERIFIED_RESULT_NOT_FOUND");
  }

  const finishTimeRaw =
    params.type === "update" ? params.finishTime?.trim() : result.submission.finishTimeRaw;
  const finishTimeSeconds = finishTimeRaw
    ? parseTimeToSeconds(finishTimeRaw)
    : result.submission.finishTimeSeconds;

  if (finishTimeSeconds === null) {
    throw new Error("INVALID_TIME");
  }

  return prisma.resultSubmission.create({
    data: {
      athleteId: result.athleteId,
      seasonId: result.seasonId,
      eventId: result.eventId,
      submissionType:
        params.type === "update" ? SubmissionType.UPDATE : SubmissionType.DELETE,
      targetVerifiedResultId: result.id,
      eventNameRaw: result.submission.eventNameRaw,
      eventDate: result.submission.eventDate,
      discipline: result.submission.discipline,
      distanceLabel: result.submission.distanceLabel,
      ageGroupClaimed: result.submission.ageGroupClaimed,
      finishTimeRaw: finishTimeRaw ?? result.submission.finishTimeRaw,
      finishTimeSeconds,
      protocolUrl: result.submission.protocolUrl,
      comment:
        params.type === "delete"
          ? "Запрос на удаление подтвержденного результата из Telegram"
          : "Запрос на изменение подтвержденного результата из Telegram",
      status: SubmissionStatus.PENDING_MANUAL_REVIEW,
    },
  });
}

export async function listPublicLeaderboardRows() {
  const season = await prisma.season.findUnique({
    where: { name: `${CYCLON_SEASON_YEAR} Season` },
  });

  if (!season) return [];

  const entries = await prisma.rankingEntry.findMany({
    where: {
      seasonId: season.id,
      athlete: { status: EntityStatus.ACTIVE },
    },
    include: {
      athlete: {
        include: {
          user: { select: { telegramId: true } },
          clubs: {
            where: { club: { status: EntityStatus.ACTIVE } },
            include: { club: true },
          },
          coaches: {
            where: { coach: { status: EntityStatus.ACTIVE } },
            include: { coach: true },
          },
          verifiedResults: {
            where: { seasonId: season.id, status: EntityStatus.ACTIVE },
            orderBy: [{ awardedPoints: "desc" }, { createdAt: "asc" }],
            include: {
              submission: true,
              event: { include: { competition: true } },
            },
          },
        },
      },
    },
    orderBy: { rank: "asc" },
  });

  return entries.map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    totalPoints: entry.totalPoints,
    scoredResultsCount: entry.scoredResultsCount,
    gender: entry.athlete.gender,
    ageGroup: entry.athlete.seasonAgeGroup,
    athleteName: getDisplayName(entry.athlete),
    telegramUsername:
      entry.athlete.showTelegramProfile && entry.athlete.telegramUsername
        ? entry.athlete.telegramUsername
        : null,
    clubs: entry.athlete.clubs.map(({ club }) => ({
      id: club.id,
      name: club.name,
    })),
    coaches: entry.athlete.coaches.map(({ coach }) => ({
      id: coach.id,
      name: coach.name,
    })),
    results: entry.athlete.verifiedResults.map((result, index) => ({
      id: result.id,
      competitionId: result.event.competitionId,
      eventName:
        result.event.competition?.name ?? result.submission.eventNameRaw,
      distanceLabel: result.submission.distanceLabel,
      finishTime: result.submission.finishTimeRaw,
      points: result.awardedPoints,
      counted: index < 3,
    })),
  }));
}

export async function getLeaderboardDirectoryOptions() {
  const [clubs, coaches, ageGroups] = await Promise.all([
    prisma.club.findMany({
      where: { status: EntityStatus.ACTIVE },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.coach.findMany({
      where: { status: EntityStatus.ACTIVE },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.athlete.findMany({
      where: {
        status: EntityStatus.ACTIVE,
        seasonAgeGroup: { not: null },
      },
      distinct: ["seasonAgeGroup"],
      select: { seasonAgeGroup: true },
      orderBy: { seasonAgeGroup: "asc" },
    }),
  ]);

  return {
    clubs,
    coaches,
    ageGroups: ageGroups
      .map((item) => item.seasonAgeGroup)
      .filter((value): value is string => Boolean(value)),
  };
}

export async function getPublicClubCard(clubId: string) {
  return prisma.club.findFirst({
    where: { id: clubId, status: EntityStatus.ACTIVE },
    include: {
      athletes: {
        where: {
          athlete: {
            status: EntityStatus.ACTIVE,
            rankingEntries: {
              some: { season: { name: `${CYCLON_SEASON_YEAR} Season` } },
            },
          },
        },
        include: {
          athlete: {
            include: {
              rankingEntries: {
                where: { season: { name: `${CYCLON_SEASON_YEAR} Season` } },
              },
            },
          },
        },
      },
    },
  });
}

export async function getPublicCoachCard(coachId: string) {
  return prisma.coach.findFirst({
    where: { id: coachId, status: EntityStatus.ACTIVE },
    include: {
      athletes: {
        where: {
          athlete: {
            status: EntityStatus.ACTIVE,
            rankingEntries: {
              some: { season: { name: `${CYCLON_SEASON_YEAR} Season` } },
            },
          },
        },
        include: {
          athlete: {
            include: {
              rankingEntries: {
                where: { season: { name: `${CYCLON_SEASON_YEAR} Season` } },
              },
            },
          },
        },
      },
    },
  });
}

export async function listPublicCompetitions(filters?: {
  discipline?: string;
}) {
  const competitions = await prisma.competition.findMany({
    where: {
      status: EntityStatus.ACTIVE,
      distances: {
        some: {
          status: EntityStatus.ACTIVE,
          ...(filters?.discipline && filters.discipline !== "all"
            ? { discipline: filters.discipline as never }
            : {}),
        },
      },
    },
    include: {
      series: true,
      distances: {
        where: {
          status: EntityStatus.ACTIVE,
          ...(filters?.discipline && filters.discipline !== "all"
            ? { discipline: filters.discipline as never }
            : {}),
        },
        include: {
          _count: {
            select: {
              protocolRows: true,
              verifiedResults: {
                where: { status: EntityStatus.ACTIVE },
              },
            },
          },
        },
        orderBy: { distanceLabel: "asc" },
      },
    },
    orderBy: [{ eventDate: "desc" }, { name: "asc" }],
  });

  return competitions.map((competition) => ({
    ...competition,
    isPast: competition.eventDate < new Date(),
    participantsCount: competition.distances.reduce(
      (sum, distance) => sum + distance._count.verifiedResults,
      0,
    ),
    protocolRowsCount: competition.distances.reduce(
      (sum, distance) => sum + distance._count.protocolRows,
      0,
    ),
  }));
}

export async function getPublicCompetition(competitionId: string) {
  const competition = await prisma.competition.findFirst({
    where: {
      id: competitionId,
      status: EntityStatus.ACTIVE,
    },
    include: {
      series: true,
      distances: {
        where: { status: EntityStatus.ACTIVE },
        include: {
          category: true,
          protocolGroups: { orderBy: { label: "asc" } },
          _count: { select: { protocolRows: true } },
          verifiedResults: {
            where: {
              status: EntityStatus.ACTIVE,
              athlete: { status: EntityStatus.ACTIVE },
            },
            include: {
              athlete: true,
              submission: true,
            },
            orderBy: { awardedPoints: "desc" },
          },
        },
        orderBy: { distanceLabel: "asc" },
      },
    },
  });

  if (!competition) return null;

  return {
    ...competition,
    isPast: competition.eventDate < new Date(),
    distances: competition.distances.map((distance) => ({
      ...distance,
      participants: distance.verifiedResults.map((result) => ({
        id: result.id,
        athleteName: getDisplayName(result.athlete),
        finishTime: result.submission.finishTimeRaw,
        ageGroup: result.ageGroupUsed,
        points: result.awardedPoints,
        placementOverall: result.submission.placementOverall,
        placementInAgeGroup: result.submission.placementInAgeGroup,
      })),
    })),
  };
}

export async function listEntityProposals(status = ProposalStatus.PENDING) {
  return prisma.entityProposal.findMany({
    where: { status },
    include: { proposer: { include: { athlete: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAdminCompetitions() {
  return prisma.competition.findMany({
    include: {
      series: true,
      distances: {
        include: {
          _count: { select: { protocolRows: true, verifiedResults: true } },
        },
        orderBy: { distanceLabel: "asc" },
      },
    },
    orderBy: [{ eventDate: "desc" }, { name: "asc" }],
  });
}

export async function getAdminCompetition(competitionId: string) {
  return prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      series: true,
      distances: {
        include: {
          category: true,
          protocolGroups: { orderBy: { label: "asc" } },
          _count: { select: { protocolRows: true, verifiedResults: true } },
        },
        orderBy: { distanceLabel: "asc" },
      },
    },
  });
}

async function resolveSeries(name?: string) {
  const normalizedName = name?.trim();
  if (!normalizedName) return null;

  return prisma.series.upsert({
    where: { name: normalizedName },
    update: { status: EntityStatus.ACTIVE, archivedAt: null },
    create: { name: normalizedName },
  });
}

type AdminCompetitionDistanceInput = {
  discipline?: string;
  distanceLabel?: string;
  protocolUrl?: string;
  categoryId?: string | null;
};

export async function createAdminCompetition(input: {
  name: string;
  eventDate: string;
  city?: string;
  seriesName?: string;
  pageUrl?: string;
  registrationUrl?: string;
  resultsUrl?: string;
  discipline?: string;
  distanceLabel?: string;
  protocolUrl?: string;
  categoryId?: string | null;
  distances?: AdminCompetitionDistanceInput[];
}) {
  const series = await resolveSeries(input.seriesName);
  const eventDate = new Date(`${input.eventDate}T09:00:00.000Z`);
  const rawDistances = input.distances?.length
    ? input.distances
    : [
        {
          discipline: input.discipline,
          distanceLabel: input.distanceLabel,
          protocolUrl: input.protocolUrl,
          categoryId: input.categoryId,
        },
      ];
  const distances = rawDistances
    .map((distance) => ({
      discipline: distance.discipline?.trim() || "RUNNING",
      distanceLabel: distance.distanceLabel?.trim() || "",
      protocolUrl: distance.protocolUrl?.trim() || null,
      categoryId: distance.categoryId ?? input.categoryId ?? null,
    }))
    .filter((distance) => distance.distanceLabel);

  if (!distances.length) {
    throw new Error("COMPETITION_DISTANCE_REQUIRED");
  }

  const competition = await prisma.competition.create({
    data: {
      name: input.name.trim(),
      eventDate,
      city: input.city?.trim() || null,
      seriesId: series?.id ?? null,
      pageUrl: input.pageUrl?.trim() || null,
      registrationUrl: input.registrationUrl?.trim() || null,
      resultsUrl: input.resultsUrl?.trim() || null,
      distances: {
        create: distances.map((distance) => ({
          name: input.name.trim(),
          eventDate,
          location: input.city?.trim() || null,
          discipline: distance.discipline as never,
          distanceLabel: distance.distanceLabel,
          sourceUrl: distance.protocolUrl,
          categoryId: distance.categoryId,
        })),
      },
    },
    include: { distances: true },
  });

  for (const distance of competition.distances) {
    if (distance.sourceUrl) {
      await importProtocolForEvent({
        eventId: distance.id,
        sourceUrl: distance.sourceUrl,
        eventName: competition.name,
        eventDate: competition.eventDate,
        location: competition.city,
        distanceLabel: distance.distanceLabel,
      });
    }
  }

  return competition;
}

export async function updateAdminCompetition(
  competitionId: string,
  input: {
    name: string;
    eventDate: string;
    city?: string;
    seriesName?: string;
    pageUrl?: string;
    registrationUrl?: string;
    resultsUrl?: string;
  },
) {
  const series = await resolveSeries(input.seriesName);
  const eventDate = new Date(`${input.eventDate}T09:00:00.000Z`);

  return prisma.$transaction(async (tx) => {
    const competition = await tx.competition.update({
      where: { id: competitionId },
      data: {
        name: input.name.trim(),
        eventDate,
        city: input.city?.trim() || null,
        seriesId: series?.id ?? null,
        pageUrl: input.pageUrl?.trim() || null,
        registrationUrl: input.registrationUrl?.trim() || null,
        resultsUrl: input.resultsUrl?.trim() || null,
      },
    });
    await tx.event.updateMany({
      where: { competitionId },
      data: {
        name: competition.name,
        eventDate: competition.eventDate,
        location: competition.city,
      },
    });
    return competition;
  });
}

export async function addAdminCompetitionDistance(
  competitionId: string,
  input: {
    discipline: string;
    distanceLabel: string;
    protocolUrl?: string;
    categoryId?: string | null;
  },
) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });
  if (!competition) throw new Error("COMPETITION_NOT_FOUND");

  const event = await prisma.event.create({
    data: {
      competitionId,
      name: competition.name,
      eventDate: competition.eventDate,
      location: competition.city,
      discipline: input.discipline as never,
      distanceLabel: input.distanceLabel.trim(),
      sourceUrl: input.protocolUrl?.trim() || null,
      categoryId: input.categoryId ?? null,
    },
  });

  if (event.sourceUrl) {
    await importProtocolForEvent({
      eventId: event.id,
      sourceUrl: event.sourceUrl,
      eventName: competition.name,
      eventDate: competition.eventDate,
      location: competition.city,
      distanceLabel: event.distanceLabel,
    });
  }

  return event;
}

export async function updateProtocolGroupBenchmark(input: {
  groupId: string;
  fifthPlaceTime: string;
  notes?: string;
}) {
  const fifthPlaceTimeSeconds = parseTimeToSeconds(input.fifthPlaceTime);
  if (fifthPlaceTimeSeconds === null) {
    throw new Error("INVALID_FIFTH_PLACE_TIME");
  }

  return prisma.protocolGroup.update({
    where: { id: input.groupId },
    data: {
      fifthPlaceTimeSeconds,
      benchmarkSource: "ADMIN",
      benchmarkNotes: input.notes?.trim() || null,
    },
  });
}

export async function archiveCompetition(competitionId: string) {
  return prisma.$transaction([
    prisma.competition.update({
      where: { id: competitionId },
      data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
    }),
    prisma.event.updateMany({
      where: { competitionId },
      data: { status: EntityStatus.ARCHIVED, archivedAt: new Date() },
    }),
  ]);
}

export async function restoreCompetition(competitionId: string) {
  return prisma.$transaction([
    prisma.competition.update({
      where: { id: competitionId },
      data: { status: EntityStatus.ACTIVE, archivedAt: null },
    }),
    prisma.event.updateMany({
      where: { competitionId },
      data: { status: EntityStatus.ACTIVE, archivedAt: null },
    }),
  ]);
}

export async function listAdminDirectories() {
  const [clubs, coaches] = await Promise.all([
    prisma.club.findMany({
      include: { _count: { select: { athletes: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.coach.findMany({
      include: { _count: { select: { athletes: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return { clubs, coaches };
}

export async function createDirectoryEntity(input: {
  type: "club" | "coach";
  name: string;
  websiteUrl?: string;
}) {
  const data = {
    name: input.name.trim(),
    websiteUrl: input.websiteUrl?.trim() || null,
    status: EntityStatus.ACTIVE,
  };
  return input.type === "club"
    ? prisma.club.create({ data })
    : prisma.coach.create({ data });
}

export async function setDirectoryEntityStatus(input: {
  type: "club" | "coach";
  id: string;
  status: EntityStatus;
}) {
  const data = {
    status: input.status,
    archivedAt:
      input.status === EntityStatus.ARCHIVED ? new Date() : null,
  };
  return input.type === "club"
    ? prisma.club.update({ where: { id: input.id }, data })
    : prisma.coach.update({ where: { id: input.id }, data });
}

export async function approveEntityProposal(params: {
  proposalId: string;
  reviewerUserId: string;
  targetEntityId?: string;
  notes?: string;
}) {
  const proposal = await prisma.entityProposal.findUnique({
    where: { id: params.proposalId },
    include: { proposer: { include: { athlete: true } } },
  });
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");

  const payload = asJsonObject(proposal.payloadJson);
  let targetEntityId = params.targetEntityId;

  if (!targetEntityId && proposal.type === ProposalType.CLUB) {
    const club = await prisma.club.create({
      data: {
        name: String(payload.name ?? "").trim(),
        status: EntityStatus.ACTIVE,
      },
    });
    targetEntityId = club.id;
  }

  if (!targetEntityId && proposal.type === ProposalType.COACH) {
    const coach = await prisma.coach.create({
      data: {
        name: String(payload.name ?? "").trim(),
        status: EntityStatus.ACTIVE,
      },
    });
    targetEntityId = coach.id;
  }

  if (!targetEntityId && proposal.type === ProposalType.COMPETITION) {
    const competition = await createAdminCompetition({
      name: String(payload.name ?? "").trim(),
      eventDate: String(payload.date ?? "").trim(),
      discipline: String(payload.discipline ?? "RUNNING"),
      distanceLabel: String(payload.distance ?? "").trim(),
    });
    targetEntityId = competition.id;
  }

  if (proposal.proposer?.athlete && targetEntityId) {
    if (proposal.type === ProposalType.CLUB) {
      await prisma.athleteClub.upsert({
        where: {
          athleteId_clubId: {
            athleteId: proposal.proposer.athlete.id,
            clubId: targetEntityId,
          },
        },
        update: {},
        create: {
          athleteId: proposal.proposer.athlete.id,
          clubId: targetEntityId,
        },
      });
    }
    if (proposal.type === ProposalType.COACH) {
      await prisma.athleteCoach.upsert({
        where: {
          athleteId_coachId: {
            athleteId: proposal.proposer.athlete.id,
            coachId: targetEntityId,
          },
        },
        update: {},
        create: {
          athleteId: proposal.proposer.athlete.id,
          coachId: targetEntityId,
        },
      });
    }
  }

  return prisma.entityProposal.update({
    where: { id: proposal.id },
    data: {
      status: params.targetEntityId
        ? ProposalStatus.MERGED
        : ProposalStatus.APPROVED,
      reviewerUserId: params.reviewerUserId,
      targetEntityId,
      reviewNotes: params.notes?.trim() || null,
    },
  });
}

export async function rejectEntityProposal(params: {
  proposalId: string;
  reviewerUserId: string;
  notes?: string;
}) {
  return prisma.entityProposal.update({
    where: { id: params.proposalId },
    data: {
      status: ProposalStatus.REJECTED,
      reviewerUserId: params.reviewerUserId,
      reviewNotes: params.notes?.trim() || null,
    },
  });
}

export async function listPendingAthleteLinkRequests() {
  return prisma.athleteLinkRequest.findMany({
    where: { status: ProposalStatus.PENDING },
    include: {
      candidateAthlete: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function reviewAthleteLinkRequest(params: {
  requestId: string;
  approve: boolean;
  notes?: string;
}) {
  const request = await prisma.athleteLinkRequest.findUnique({
    where: { id: params.requestId },
    include: { candidateAthlete: { include: { user: true } } },
  });
  if (!request) throw new Error("LINK_REQUEST_NOT_FOUND");

  if (!params.approve) {
    return prisma.athleteLinkRequest.update({
      where: { id: request.id },
      data: {
        status: ProposalStatus.REJECTED,
        reviewNotes: params.notes?.trim() || null,
      },
    });
  }

  if (!request.candidateAthlete) {
    throw new Error("LINK_CANDIDATE_NOT_FOUND");
  }

  const profile = asJsonObject(request.profileJson);
  const names = splitFullName(String(profile.fullName ?? ""));
  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.candidateAthlete.userId },
      data: { telegramId: request.telegramId },
    }),
    prisma.athlete.update({
      where: { id: request.candidateAthlete.id },
      data: {
        firstName: names.firstName || request.candidateAthlete.firstName,
        lastName: names.lastName || request.candidateAthlete.lastName,
        middleName:
          names.firstName && names.lastName
            ? names.middleName
            : request.candidateAthlete.middleName,
        telegramUsername: request.telegramUsername,
        showTelegramProfile: Boolean(profile.showTelegramProfile),
      },
    }),
    prisma.athleteLinkRequest.update({
      where: { id: request.id },
      data: {
        status: ProposalStatus.APPROVED,
        requestedAthleteId: request.candidateAthlete.id,
        reviewNotes: params.notes?.trim() || null,
      },
    }),
  ]);

  const conversation = await prisma.telegramConversation.findUnique({
    where: { telegramId: request.telegramId },
  });
  if (conversation) {
    await prisma.telegramConversation.update({
      where: { id: conversation.id },
      data: {
        userId: request.candidateAthlete.userId,
        state: "MAIN",
      },
    });
  }

  return request;
}

export function asJsonObject(value: unknown) {
  return value as Prisma.JsonObject;
}
