import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { PrismaClient, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getDatabaseUrl() {
  const runtimeDatabaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim() ?? "";

  if (runtimeDatabaseUrl && !runtimeDatabaseUrl.startsWith("file:")) {
    return runtimeDatabaseUrl;
  }

  if (postgresUrl) {
    return postgresUrl;
  }

  throw new Error(
    "Protocol import requires DATABASE_URL or DATABASE_URL_POSTGRES.",
  );
}

export function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseUrl(),
    }),
  });
}

export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

export function resolveNormalizedProtocolPath(requestPath, normalizedPath) {
  return path.resolve(path.dirname(requestPath), normalizedPath);
}

export function parseTimeToSeconds(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parts = normalizedValue.split(":");

  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const numericParts = parts.map((part) => Number(part));

  if (numericParts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (numericParts.length === 2) {
    const [minutes, seconds] = numericParts;
    return Math.round(minutes * 60 + seconds);
  }

  const [hours, minutes, seconds] = numericParts;
  return Math.round(hours * 3600 + minutes * 60 + seconds);
}

export function inferGender({ ageGroupRaw, genderRaw }) {
  const candidates = [genderRaw, ageGroupRaw]
    .map((value) => String(value ?? "").trim().toUpperCase())
    .filter(Boolean);

  for (const value of candidates) {
    if (
      value.startsWith("M") ||
      value.startsWith("М") ||
      value === "MALE" ||
      value === "MAN"
    ) {
      return Gender.MALE;
    }

    if (
      value.startsWith("W") ||
      value.startsWith("F") ||
      value.startsWith("Ж") ||
      value === "FEMALE" ||
      value === "WOMAN"
    ) {
      return Gender.FEMALE;
    }
  }

  return null;
}

function normalizePlacement(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
}

export function validateImportRequest(request) {
  const errors = [];

  const requiredFields = [
    "organizer",
    "sourceUrl",
    "discipline",
    "eventName",
    "eventDate",
    "distanceLabel",
    "normalizedProtocolPath",
  ];

  for (const field of requiredFields) {
    if (!String(request?.[field] ?? "").trim()) {
      errors.push(`Missing request field: ${field}`);
    }
  }

  return errors;
}

export function validateNormalizedProtocol(protocol) {
  const errors = [];

  const requiredFields = [
    "organizer",
    "sourceUrl",
    "eventName",
    "eventDate",
    "distanceLabel",
    "rows",
  ];

  for (const field of requiredFields) {
    if (field === "rows") {
      if (!Array.isArray(protocol?.rows)) {
        errors.push("Protocol rows must be an array.");
      }
      continue;
    }

    if (!String(protocol?.[field] ?? "").trim()) {
      errors.push(`Missing protocol field: ${field}`);
    }
  }

  if (Array.isArray(protocol?.rows)) {
    protocol.rows.forEach((row, index) => {
      if (!String(row?.athleteNameRaw ?? "").trim()) {
        errors.push(`Row ${index + 1}: athleteNameRaw is required.`);
      }

      if (!String(row?.finishTimeRaw ?? "").trim()) {
        errors.push(`Row ${index + 1}: finishTimeRaw is required.`);
      }
    });
  }

  return errors;
}

export function buildPersistableRows(protocol) {
  return protocol.rows.map((row) => ({
    athleteNameRaw: String(row.athleteNameRaw).trim(),
    finishTimeRaw: String(row.finishTimeRaw).trim(),
    finishTimeSeconds: parseTimeToSeconds(row.finishTimeRaw),
    ageGroupRaw: String(row.ageGroupRaw ?? "").trim() || null,
    gender: inferGender(row),
    placementOverall: normalizePlacement(row.placeOverall),
    placementInAgeGroup: normalizePlacement(row.placeAgeGroup),
  }));
}

export async function upsertEventWithProtocol({
  prisma,
  request,
  protocol,
  persistableRows,
  apply,
}) {
  const eventDate = new Date(`${request.eventDate}T09:00:00.000Z`);

  const summary = {
    organizer: request.organizer,
    eventName: request.eventName,
    eventDate: request.eventDate,
    discipline: request.discipline,
    distanceLabel: request.distanceLabel,
    sourceUrl: request.sourceUrl,
    location: request.location?.trim() || protocol.location?.trim() || null,
    rowsInFile: protocol.rows.length,
    rowsPrepared: persistableRows.length,
    rowsWithParsedTime: persistableRows.filter(
      (row) => row.finishTimeSeconds !== null,
    ).length,
    notes: request.notes?.trim() || null,
    mode: apply ? "apply" : "dry-run",
  };

  if (!apply) {
    return summary;
  }

  const persistedEvent = await prisma.$transaction(async (tx) => {
    const existingEvent = await tx.event.findFirst({
      where: {
        name: request.eventName,
        eventDate,
        discipline: request.discipline,
        distanceLabel: request.distanceLabel,
      },
    });

    const event = existingEvent
      ? await tx.event.update({
          where: { id: existingEvent.id },
          data: {
            location: summary.location,
            sourceUrl: request.sourceUrl,
          },
        })
      : await tx.event.create({
          data: {
            name: request.eventName,
            eventDate,
            discipline: request.discipline,
            distanceLabel: request.distanceLabel,
            location: summary.location,
            sourceUrl: request.sourceUrl,
          },
        });

    if (request.replaceExistingRows !== false) {
      await tx.eventProtocolRow.deleteMany({
        where: { eventId: event.id },
      });
    }

    for (let index = 0; index < persistableRows.length; index += 500) {
      await tx.eventProtocolRow.createMany({
        data: persistableRows.slice(index, index + 500).map((row) => ({
          eventId: event.id,
          athleteNameRaw: row.athleteNameRaw,
          gender: row.gender,
          ageGroupRaw: row.ageGroupRaw,
          finishTimeRaw: row.finishTimeRaw,
          finishTimeSeconds: row.finishTimeSeconds,
          placementOverall: row.placementOverall,
          placementInAgeGroup: row.placementInAgeGroup,
        })),
      });
    }

    return event;
  });

  return {
    ...summary,
    eventId: persistedEvent.id,
  };
}

