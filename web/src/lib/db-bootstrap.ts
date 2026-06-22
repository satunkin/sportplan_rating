import { Prisma } from "@prisma/client";

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
      let existingTables: Array<{ tableName: string }>;

      try {
        existingTables = await prisma.$queryRaw<Array<{ tableName: string }>>(
          Prisma.sql`
            SELECT table_name AS "tableName"
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (${Prisma.join(REQUIRED_TABLES)})
          `,
        );
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : "Unknown database error";
        throw createSetupError(`Database readiness check failed: ${reason}`);
      }

      const existingTableNames = new Set(
        existingTables.map((table) => table.tableName),
      );
      const missingTables = REQUIRED_TABLES.filter(
        (tableName) => !existingTableNames.has(tableName),
      );

      if (missingTables.length > 0) {
        throw createSetupError(
          `Database is missing Prisma-managed tables: ${missingTables.join(", ")}.`,
        );
      }
    });
  }

  return bootstrapPromise;
}
