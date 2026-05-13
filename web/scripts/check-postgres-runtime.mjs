import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { getRuntimeDatabaseUrl } from "./lib/runtime-env.mjs";

const connectionString = getRuntimeDatabaseUrl();

if (!connectionString) {
  console.error(
    "PostgreSQL runtime smoke check failed. Configure DATABASE_URL or DATABASE_URL_POSTGRES first.",
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  const [row] = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
  console.log("PostgreSQL runtime smoke check passed:", row);
}

main()
  .catch((error) => {
    console.error("PostgreSQL runtime smoke check failed.");

    const driverAdapterError =
      error &&
      typeof error === "object" &&
      "meta" in error &&
      error.meta &&
      typeof error.meta === "object" &&
      "driverAdapterError" in error.meta
        ? error.meta.driverAdapterError
        : null;

    const databaseNotReachable =
      (error && typeof error === "object" && error.code === "ECONNREFUSED") ||
      (driverAdapterError &&
        typeof driverAdapterError === "object" &&
        "cause" in driverAdapterError &&
        driverAdapterError.cause &&
        typeof driverAdapterError.cause === "object" &&
        "kind" in driverAdapterError.cause &&
        driverAdapterError.cause.kind === "DatabaseNotReachable");

    if (databaseNotReachable) {
      console.error(
        "The configured PostgreSQL server is unreachable. Check DATABASE_URL / DATABASE_URL_POSTGRES and retry.",
      );
    }

    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
