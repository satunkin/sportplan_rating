import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  process.env.DATABASE_URL_POSTGRES?.trim();

if (!connectionString) {
  throw new Error("Database URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  const [
    competitions,
    distances,
    orphanDistances,
    protocolRows,
    submissions,
    verifiedResults,
    protocolGroups,
  ] = await Promise.all([
    prisma.competition.count(),
    prisma.event.count(),
    prisma.event.count({ where: { competitionId: null } }),
    prisma.eventProtocolRow.count(),
    prisma.resultSubmission.count(),
    prisma.verifiedResult.count(),
    prisma.protocolGroup.count(),
  ]);

  const report = {
    competitions,
    distances,
    orphanDistances,
    protocolRows,
    protocolGroups,
    submissions,
    verifiedResults,
  };

  console.log(JSON.stringify(report, null, 2));

  if (orphanDistances > 0) {
    throw new Error(
      `Migration verification failed: ${orphanDistances} Event rows have no Competition parent.`,
    );
  }
} finally {
  await prisma.$disconnect();
}
