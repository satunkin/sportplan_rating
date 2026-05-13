import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const runtimeDatabaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim() ?? "";
const connectionString =
  runtimeDatabaseUrl && !runtimeDatabaseUrl.startsWith("file:")
    ? runtimeDatabaseUrl
    : postgresUrl || "postgresql://postgres:postgres@localhost:5432/cyclon_rating?schema=public";

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

    if (error && typeof error === "object" && error.code === "ECONNREFUSED") {
      console.error(
        "DATABASE_URL_POSTGRES points to an unreachable PostgreSQL server. Start PostgreSQL or update the connection string before retrying.",
      );
    }

    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
