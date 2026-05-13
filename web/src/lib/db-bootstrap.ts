import { prisma } from "@/lib/prisma";

const REQUIRED_TABLES = [
  "_prisma_migrations",
  "User",
  "Athlete",
  "ResultSubmission",
  "VerifiedResult",
  "RankingEntry",
];

let bootstrapPromise: Promise<void> | null = null;

function createSetupError(reason: string) {
  return new Error(
    `${reason} Run "npm run db:deploy" in /Users/satunkin/Codex_projects/rating/web to apply Prisma migrations.`,
  );
}

export function ensureDatabaseReady() {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.resolve().then(async () => {
      const missingTables: string[] = [];

      for (const tableName of REQUIRED_TABLES) {
        try {
          await prisma.$queryRawUnsafe(
            `SELECT 1 FROM "${tableName}" LIMIT 1`,
          );
        } catch {
          missingTables.push(tableName);
        }
      }

      if (missingTables.length > 0) {
        throw createSetupError(
          `Database is missing Prisma-managed tables: ${missingTables.join(", ")}.`,
        );
      }
    });
  }

  return bootstrapPromise;
}
