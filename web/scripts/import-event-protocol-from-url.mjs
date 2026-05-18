import { createPrismaClient, upsertEventWithProtocol, buildPersistableRows } from "./lib/protocol-import.mjs";
import { fetchNormalizedProtocolFromSource } from "../src/lib/protocol-import/parser-runtime.mjs";

function readFlag(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function main() {
  const sourceUrl = readFlag("--url");
  const eventName = readFlag("--name");
  const eventDate = readFlag("--date");
  const discipline = readFlag("--discipline");
  const distanceLabel = readFlag("--distance");
  const location = readFlag("--location");

  if (!sourceUrl || !eventName || !eventDate || !discipline || !distanceLabel) {
    throw new Error(
      "Usage: node scripts/import-event-protocol-from-url.mjs --url <url> --name <eventName> --date <YYYY-MM-DD> --discipline <RUNNING|CYCLING|SWIMMING|TRIATHLON> --distance <label> [--location <text>] [--apply]",
    );
  }

  const protocol = await fetchNormalizedProtocolFromSource({
    sourceUrl,
    eventName,
    eventDate,
    distanceLabel,
    location,
  });

  if (!protocol) {
    throw new Error(`Unsupported protocol URL: ${sourceUrl}`);
  }

  const request = {
    organizer: protocol.organizer,
    sourceUrl,
    discipline,
    eventName,
    eventDate,
    location: location ?? protocol.location ?? null,
    distanceLabel,
    normalizedProtocolPath: "<live>",
    replaceExistingRows: true,
    notes: "Live source import",
  };

  const persistableRows = buildPersistableRows(protocol);
  const apply = hasFlag("--apply");
  const prisma = apply ? createPrismaClient() : null;

  try {
    const summary = await upsertEventWithProtocol({
      prisma,
      request,
      protocol,
      persistableRows,
      apply,
    });

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
