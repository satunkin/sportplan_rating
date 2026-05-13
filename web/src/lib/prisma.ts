import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { getDatabaseUrl } from "@/lib/runtime-config";

type AppPrismaClient = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl();

  if (
    databaseUrl.startsWith("postgresql://") ||
    databaseUrl.startsWith("postgres://")
  ) {
    return new PrismaClient({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
      }) as never,
    });
  }

  throw new Error(
    `Unsupported DATABASE_URL protocol. Expected postgres:// or postgresql://, got "${databaseUrl}".`,
  );
}

export const prisma: AppPrismaClient =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
