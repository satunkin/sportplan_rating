import "dotenv/config";

import pg from "pg";

const { Client } = pg;
const applyChanges = process.argv.includes("--apply");

function getConnectionString() {
  const directUrl = process.env.DIRECT_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim();

  if (directUrl) return directUrl;
  if (databaseUrl && !databaseUrl.startsWith("file:")) return databaseUrl;
  if (postgresUrl) return postgresUrl;
  throw new Error("Database URL is required.");
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function competitionKey(competition) {
  return `${normalizeText(competition.name)}|${competition.eventDate.slice(0, 10)}`;
}

function eventKey(event) {
  return `${event.discipline}|${normalizeText(event.distanceLabel)}`;
}

function eventWeight(event) {
  return (
    event.verifiedResultsCount * 1_000_000 +
    event.submissionsCount * 100_000 +
    event.protocolRowsCount * 100 +
    event.protocolGroupsCount * 10 +
    Number(Boolean(event.sourceUrl)) +
    Number(Boolean(event.categoryId))
  );
}

function competitionWeight(competition, events) {
  const relatedEvents = events.filter(
    (event) => event.competitionId === competition.id,
  );
  return (
    relatedEvents.reduce((sum, event) => sum + eventWeight(event), 0) +
    Number(Boolean(competition.resultsUrl)) * 10 +
    Number(Boolean(competition.registrationUrl)) * 5 +
    Number(Boolean(competition.pageUrl))
  );
}

function chooseRichest(items, getWeight) {
  return [...items].sort((left, right) => {
    const weightDifference = getWeight(right) - getWeight(left);
    if (weightDifference !== 0) return weightDifference;
    return left.createdAt.localeCompare(right.createdAt);
  })[0];
}

async function loadSnapshot(client) {
  const countsResult = await client.query(`
      SELECT
        (SELECT COUNT(*)::integer FROM "User" WHERE role = 'ATHLETE') AS "athleteUsers",
        (SELECT COUNT(*)::integer FROM "User" WHERE role = 'ADMIN') AS "adminUsers",
        (SELECT COUNT(*)::integer FROM "Athlete") AS athletes,
        (SELECT COUNT(*)::integer FROM "ResultSubmission") AS submissions,
        (SELECT COUNT(*)::integer FROM "VerifiedResult") AS "verifiedResults",
        (SELECT COUNT(*)::integer FROM "RankingEntry") AS "rankingEntries",
        (SELECT COUNT(*)::integer FROM "Competition") AS competitions,
        (SELECT COUNT(*)::integer FROM "Event") AS distances,
        (SELECT COUNT(*)::integer FROM "Event" WHERE "competitionId" IS NULL) AS "orphanDistances",
        (SELECT COUNT(*)::integer FROM "EventProtocolRow") AS "protocolRows",
        (SELECT COUNT(*)::integer FROM "ProtocolGroup") AS "protocolGroups"
    `);
  const competitionsResult = await client.query(`
      SELECT
        id,
        name,
        "eventDate"::text AS "eventDate",
        city,
        "pageUrl",
        "registrationUrl",
        "resultsUrl",
        status::text,
        "createdAt"::text AS "createdAt"
      FROM "Competition"
      ORDER BY "eventDate", name, "createdAt"
    `);
  const eventsResult = await client.query(`
      SELECT
        events.id,
        events."competitionId",
        events.discipline::text AS discipline,
        events."distanceLabel",
        events."sourceUrl",
        events."categoryId",
        events."createdAt"::text AS "createdAt",
        (SELECT COUNT(*)::integer FROM "EventProtocolRow" rows WHERE rows."eventId" = events.id) AS "protocolRowsCount",
        (SELECT COUNT(*)::integer FROM "ProtocolGroup" groups WHERE groups."eventId" = events.id) AS "protocolGroupsCount",
        (SELECT COUNT(*)::integer FROM "ResultSubmission" submissions WHERE submissions."eventId" = events.id) AS "submissionsCount",
        (SELECT COUNT(*)::integer FROM "VerifiedResult" results WHERE results."eventId" = events.id) AS "verifiedResultsCount"
      FROM "Event" events
      WHERE events."competitionId" IS NOT NULL
      ORDER BY events."createdAt"
    `);

  const competitions = competitionsResult.rows;
  const events = eventsResult.rows;
  const grouped = new Map();

  for (const competition of competitions) {
    const key = competitionKey(competition);
    const group = grouped.get(key) ?? [];
    group.push(competition);
    grouped.set(key, group);
  }

  const duplicateGroups = [...grouped.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const canonical = chooseRichest(group, (competition) =>
        competitionWeight(competition, events),
      );
      return {
        canonical,
        duplicates: group.filter((item) => item.id !== canonical.id),
        all: group,
      };
    });

  return {
    counts: countsResult.rows[0],
    competitions,
    events,
    duplicateGroups,
  };
}

function printSnapshot(snapshot, label) {
  console.log(`\n${label}`);
  console.table([snapshot.counts]);
  console.log(`Competition rows: ${snapshot.competitions.length}`);
  console.log(`Duplicate groups: ${snapshot.duplicateGroups.length}`);

  for (const group of snapshot.duplicateGroups) {
    console.log(
      `- ${group.canonical.name} (${group.canonical.eventDate.slice(0, 10)}): keep ${group.canonical.id}`,
    );
    for (const duplicate of group.duplicates) {
      console.log(`  remove ${duplicate.id}`);
    }
  }
}

async function mergeDuplicateCompetitions(client, snapshot) {
  for (const group of snapshot.duplicateGroups) {
    const competitionIds = group.all.map((competition) => competition.id);
    const relatedEvents = snapshot.events.filter((event) =>
      competitionIds.includes(event.competitionId),
    );
    const eventsByKey = new Map();

    for (const event of relatedEvents) {
      const key = eventKey(event);
      const bucket = eventsByKey.get(key) ?? [];
      bucket.push(event);
      eventsByKey.set(key, bucket);
    }

    for (const eventGroup of eventsByKey.values()) {
      const winner = chooseRichest(eventGroup, eventWeight);

      await client.query(
        `UPDATE "Event" SET "competitionId" = $1 WHERE id = $2`,
        [group.canonical.id, winner.id],
      );

      for (const loser of eventGroup.filter((event) => event.id !== winner.id)) {
        await client.query(
          `UPDATE "ResultSubmission" SET "eventId" = $1 WHERE "eventId" = $2`,
          [winner.id, loser.id],
        );
        await client.query(
          `UPDATE "VerifiedResult" SET "eventId" = $1 WHERE "eventId" = $2`,
          [winner.id, loser.id],
        );
        await client.query(
          `
            UPDATE "ProtocolGroup"
            SET "eventId" = $1
            WHERE "eventId" = $2
              AND "groupKey" NOT IN (
                SELECT "groupKey" FROM "ProtocolGroup" WHERE "eventId" = $1
              )
          `,
          [winner.id, loser.id],
        );
        await client.query(
          `
            UPDATE "Event" AS winner
            SET
              "sourceUrl" = COALESCE(winner."sourceUrl", loser."sourceUrl"),
              location = COALESCE(winner.location, loser.location),
              "categoryId" = COALESCE(winner."categoryId", loser."categoryId")
            FROM "Event" AS loser
            WHERE winner.id = $1 AND loser.id = $2
          `,
          [winner.id, loser.id],
        );
        await client.query(`DELETE FROM "Event" WHERE id = $1`, [loser.id]);
      }
    }

    await client.query(
      `DELETE FROM "Competition" WHERE id = ANY($1::text[])`,
      [group.duplicates.map((competition) => competition.id)],
    );
  }
}

async function applyCleanup(client, snapshot) {
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM "User" WHERE role = 'ATHLETE'`);
    await client.query(`DELETE FROM "Athlete"`);
    await mergeDuplicateCompetitions(client, snapshot);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

const client = new Client({ connectionString: getConnectionString() });

try {
  await client.connect();
  const before = await loadSnapshot(client);
  printSnapshot(before, "BEFORE");

  if (!applyChanges) {
    console.log("\nDry-run only. Re-run with --apply to execute the transaction.");
  } else {
    await applyCleanup(client, before);
    const after = await loadSnapshot(client);
    printSnapshot(after, "AFTER");

    if (
      after.counts.athleteUsers !== 0 ||
      after.counts.athletes !== 0 ||
      after.counts.submissions !== 0 ||
      after.counts.verifiedResults !== 0 ||
      after.counts.rankingEntries !== 0 ||
      after.duplicateGroups.length !== 0
    ) {
      throw new Error("POST_CLEANUP_VERIFICATION_FAILED");
    }
  }
} finally {
  await client.end();
}
