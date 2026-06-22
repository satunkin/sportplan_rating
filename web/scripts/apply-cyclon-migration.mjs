import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const migrationName = "20260620120000_cyclon_competitions_telegram";
const migrationPath = fileURLToPath(
  new URL(
    `../prisma/postgres-migrations/${migrationName}/migration.sql`,
    import.meta.url,
  ),
);
const connectionString =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL_POSTGRES?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DIRECT_URL, DATABASE_URL_POSTGRES or DATABASE_URL is required.");
}

const sql = await readFile(migrationPath, "utf8");
const checksum = createHash("sha256").update(sql).digest("hex");
const client = new pg.Client({ connectionString });

await client.connect();

try {
  const applied = await client.query(
    `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = $1 LIMIT 1`,
    [migrationName],
  );

  if (applied.rowCount) {
    console.log(`Migration ${migrationName} is already applied.`);
    process.exitCode = 0;
  } else {
    const before = await client.query(`
      SELECT
        (SELECT count(*)::int FROM "Event") AS distances,
        (SELECT count(*)::int FROM "EventProtocolRow") AS protocol_rows,
        (SELECT count(*)::int FROM "ResultSubmission") AS submissions,
        (SELECT count(*)::int FROM "VerifiedResult") AS verified_results
    `);

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations" (
          id, checksum, finished_at, migration_name, logs,
          rolled_back_at, started_at, applied_steps_count
        ) VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
        [randomUUID(), checksum, migrationName],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }

    const after = await client.query(`
      SELECT
        (SELECT count(*)::int FROM "Competition") AS competitions,
        (SELECT count(*)::int FROM "Event") AS distances,
        (SELECT count(*)::int FROM "Event" WHERE "competitionId" IS NULL) AS orphan_distances,
        (SELECT count(*)::int FROM "EventProtocolRow") AS protocol_rows,
        (SELECT count(*)::int FROM "ProtocolGroup") AS protocol_groups,
        (SELECT count(*)::int FROM "ResultSubmission") AS submissions,
        (SELECT count(*)::int FROM "VerifiedResult") AS verified_results
    `);

    console.log(
      JSON.stringify(
        {
          migration: migrationName,
          before: before.rows[0],
          after: after.rows[0],
        },
        null,
        2,
      ),
    );

    if (after.rows[0].orphan_distances !== 0) {
      throw new Error("Migration completed with orphan competition distances.");
    }
  }
} finally {
  await client.end();
}
