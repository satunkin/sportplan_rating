import path from "node:path";

import {
  buildPersistableRows,
  createPrismaClient,
  readJsonFile,
  resolveNormalizedProtocolPath,
  upsertEventWithProtocol,
  validateImportRequest,
  validateNormalizedProtocol,
} from "./lib/protocol-import.mjs";

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
  const requestPathFlag = readFlag("--request");

  if (!requestPathFlag) {
    throw new Error(
      "Usage: node scripts/import-event-protocol.mjs --request <path> [--apply]",
    );
  }

  const requestPath = path.resolve(process.cwd(), requestPathFlag);
  const request = await readJsonFile(requestPath);
  const requestErrors = validateImportRequest(request);

  if (requestErrors.length > 0) {
    throw new Error(`Invalid request:\\n- ${requestErrors.join("\\n- ")}`);
  }

  const normalizedProtocolPath = resolveNormalizedProtocolPath(
    requestPath,
    request.normalizedProtocolPath,
  );
  const protocol = await readJsonFile(normalizedProtocolPath);
  const protocolErrors = validateNormalizedProtocol(protocol);

  if (protocolErrors.length > 0) {
    throw new Error(`Invalid protocol:\\n- ${protocolErrors.join("\\n- ")}`);
  }

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

