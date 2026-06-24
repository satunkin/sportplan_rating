import "dotenv/config";

import { PrismaClient, EntityStatus, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEMO_EMAILS = [
  "alexey.demo@cyclon.local",
  "marina.demo@cyclon.local",
  "ilya.demo@cyclon.local",
  "anna.demo@cyclon.local",
];

const DEMO_EVENT_NAMES = [
  "Весенний забег 10 км",
  "Городской полумарафон",
  "Open Water Cup",
  "Cyclon Tri Sprint",
  "Gran Fondo 90 км",
  "Cyclon Olympic Triathlon",
  "Ночной забег 5 км",
  "Осенний марафон",
  "Cyclon Tri Half",
];

const DEMO_PROTOCOL_URL_PREFIX = "https://example.com/results/";
const DEMO_COMMENT = "Демо-заполнение для проверки рейтинга";
const DEMO_ADMIN_NOTES = "Демо-подтверждение для просмотра рейтинга";

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getConnectionString() {
  const directUrl = process.env.DIRECT_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim();

  if (directUrl) {
    return directUrl;
  }

  if (databaseUrl && !databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  if (postgresUrl) {
    return postgresUrl;
  }

  throw new Error("Database URL is required.");
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getConnectionString() }),
  });
}

async function getDemoScope(prisma) {
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: DEMO_EMAILS,
      },
    },
    include: {
      athlete: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  const demoAthleteIds = demoUsers
    .map((user) => user.athlete?.id)
    .filter(Boolean);

  const demoSubmissions = await prisma.resultSubmission.findMany({
    where: {
      OR: [
        {
          athleteId: {
            in: demoAthleteIds,
          },
        },
        {
          protocolUrl: {
            startsWith: DEMO_PROTOCOL_URL_PREFIX,
          },
        },
        {
          comment: DEMO_COMMENT,
        },
        {
          adminNotes: DEMO_ADMIN_NOTES,
        },
      ],
    },
    select: {
      id: true,
      eventId: true,
    },
  });

  const eventIdsFromSubmissions = demoSubmissions
    .map((submission) => submission.eventId)
    .filter(Boolean);

  const demoEvents = await prisma.event.findMany({
    where: {
      OR: [
        {
          id: {
            in: eventIdsFromSubmissions,
          },
        },
        {
          sourceUrl: {
            startsWith: DEMO_PROTOCOL_URL_PREFIX,
          },
        },
        {
          name: {
            in: DEMO_EVENT_NAMES,
          },
        },
      ],
    },
    include: {
      competition: {
        include: {
          distances: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: [{ eventDate: "asc" }, { name: "asc" }],
  });

  const demoEventIds = demoEvents.map((event) => event.id);
  const demoCompetitionCandidates = new Map();

  for (const event of demoEvents) {
    if (event.competition) {
      demoCompetitionCandidates.set(event.competition.id, event.competition);
    }
  }

  const directDemoCompetitions = await prisma.competition.findMany({
    where: {
      OR: [
        {
          resultsUrl: {
            startsWith: DEMO_PROTOCOL_URL_PREFIX,
          },
        },
        {
          pageUrl: {
            startsWith: DEMO_PROTOCOL_URL_PREFIX,
          },
        },
        {
          name: {
            in: DEMO_EVENT_NAMES,
          },
        },
      ],
    },
    include: {
      distances: {
        select: {
          id: true,
        },
      },
    },
  });

  for (const competition of directDemoCompetitions) {
    demoCompetitionCandidates.set(competition.id, competition);
  }

  const demoCompetitions = Array.from(demoCompetitionCandidates.values()).filter(
    (competition) =>
      competition.distances.every((distance) => demoEventIds.includes(distance.id)),
  );

  return {
    demoUsers,
    demoAthleteIds,
    demoSubmissions,
    demoEvents,
    demoCompetitions,
  };
}

async function recalculateSeasonRankings(prisma) {
  const seasons = await prisma.season.findMany({
    select: {
      id: true,
    },
  });

  for (const season of seasons) {
    const verified = await prisma.verifiedResult.findMany({
      where: {
        seasonId: season.id,
        status: EntityStatus.ACTIVE,
        athlete: { status: EntityStatus.ACTIVE },
      },
      include: {
        athlete: true,
      },
      orderBy: [{ athleteId: "asc" }, { awardedPoints: "desc" }],
    });

    const grouped = new Map();

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
      where: { seasonId: season.id },
    });

    for (const gender of [Gender.MALE, Gender.FEMALE]) {
      const genderLeaderboard = leaderboard.filter(
        (entry) => entry.gender === gender,
      );
      let previousEntry;

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
            seasonId: season.id,
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
}

async function buildSummary(prisma, scope) {
  const demoEventIds = scope.demoEvents.map((event) => event.id);
  const demoSubmissionIds = scope.demoSubmissions.map((submission) => submission.id);

  const [
    demoVerifiedResults,
    demoProtocolRows,
    demoProtocolGroups,
    totalAthletes,
    totalCompetitions,
    totalEvents,
    totalSubmissions,
    totalVerifiedResults,
  ] = await Promise.all([
    prisma.verifiedResult.count({
      where: {
        OR: [
          {
            athleteId: {
              in: scope.demoAthleteIds,
            },
          },
          {
            eventId: {
              in: demoEventIds,
            },
          },
          {
            submissionId: {
              in: demoSubmissionIds,
            },
          },
        ],
      },
    }),
    prisma.eventProtocolRow.count({
      where: {
        eventId: {
          in: demoEventIds,
        },
      },
    }),
    prisma.protocolGroup.count({
      where: {
        eventId: {
          in: demoEventIds,
        },
      },
    }),
    prisma.athlete.count(),
    prisma.competition.count(),
    prisma.event.count(),
    prisma.resultSubmission.count(),
    prisma.verifiedResult.count(),
  ]);

  return {
    demo: {
      users: scope.demoUsers.length,
      athletes: scope.demoAthleteIds.length,
      submissions: scope.demoSubmissions.length,
      verifiedResults: demoVerifiedResults,
      competitions: scope.demoCompetitions.length,
      distances: scope.demoEvents.length,
      protocolRows: demoProtocolRows,
      protocolGroups: demoProtocolGroups,
      userEmails: scope.demoUsers.map((user) => user.email),
      eventNames: scope.demoEvents.map((event) => event.name),
      competitionNames: scope.demoCompetitions.map(
        (competition) => competition.name,
      ),
    },
    totals: {
      athletes: totalAthletes,
      competitions: totalCompetitions,
      distances: totalEvents,
      submissions: totalSubmissions,
      verifiedResults: totalVerifiedResults,
    },
  };
}

async function deleteDemoData(prisma, scope) {
  const demoUserIds = scope.demoUsers.map((user) => user.id);
  const demoEventIds = scope.demoEvents.map((event) => event.id);
  const demoCompetitionIds = scope.demoCompetitions.map(
    (competition) => competition.id,
  );
  const demoSubmissionIds = scope.demoSubmissions.map(
    (submission) => submission.id,
  );

  await prisma.$transaction(async (tx) => {
    await tx.verifiedResult.deleteMany({
      where: {
        OR: [
          {
            athleteId: {
              in: scope.demoAthleteIds,
            },
          },
          {
            eventId: {
              in: demoEventIds,
            },
          },
          {
            submissionId: {
              in: demoSubmissionIds,
            },
          },
        ],
      },
    });

    await tx.resultSubmission.deleteMany({
      where: {
        OR: [
          {
            athleteId: {
              in: scope.demoAthleteIds,
            },
          },
          {
            id: {
              in: demoSubmissionIds,
            },
          },
        ],
      },
    });

    await tx.event.deleteMany({
      where: {
        id: {
          in: demoEventIds,
        },
      },
    });

    await tx.user.deleteMany({
      where: {
        id: {
          in: demoUserIds,
        },
      },
    });

    await tx.competition.deleteMany({
      where: {
        id: {
          in: demoCompetitionIds,
        },
        distances: {
          none: {},
        },
      },
    });
  });

  await recalculateSeasonRankings(prisma);
}

async function main() {
  const apply = hasFlag("--apply");
  const prisma = createPrismaClient();

  try {
    const scope = await getDemoScope(prisma);
    const before = await buildSummary(prisma, scope);

    if (!apply) {
      console.log(JSON.stringify({ mode: "dry-run", ...before }, null, 2));
      return;
    }

    await deleteDemoData(prisma, scope);

    const afterScope = await getDemoScope(prisma);
    const after = await buildSummary(prisma, afterScope);

    console.log(
      JSON.stringify(
        {
          mode: "applied",
          deleted: before.demo,
          remainingDemo: after.demo,
          totalsAfterApply: after.totals,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
