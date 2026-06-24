import { BenchmarkSource, type Gender } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fetchNormalizedProtocolFromSource } from "@/lib/protocol-import/parser-runtime.mjs";
import { parseTimeToSeconds } from "@/lib/time";
import type {
  NormalizedEventProtocol,
  NormalizedProtocolRow,
} from "@/lib/protocol-import/types";

type SourceProtocolImportSummary = {
  eventId: string;
  organizer: string;
  rowsImported: number;
  rowsWithParsedTime: number;
  sourceUrl: string;
};

function inferGender(row: NormalizedProtocolRow): Gender | null {
  const candidates = [row.genderRaw, row.ageGroupRaw]
    .map((value) => String(value ?? "").trim().toUpperCase())
    .filter(Boolean);

  for (const value of candidates) {
    if (
      value.startsWith("M") ||
      value.startsWith("М") ||
      value === "MALE" ||
      value === "MAN"
    ) {
      return "MALE";
    }

    if (
      value.startsWith("W") ||
      value.startsWith("F") ||
      value.startsWith("Ж") ||
      value === "FEMALE" ||
      value === "WOMAN"
    ) {
      return "FEMALE";
    }
  }

  return null;
}

function normalizePlacement(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number.isInteger(value) && value > 0 ? value : null;
}

function formatEventDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDistanceLabel(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

export async function persistNormalizedProtocolForEvent(params: {
  eventId: string;
  protocol: NormalizedEventProtocol;
  distanceLabel?: string | null;
}) {
  const targetDistanceLabel = normalizeDistanceLabel(params.distanceLabel);
  const protocolRows = targetDistanceLabel
    ? params.protocol.rows.filter((row) => {
        const rowDistanceLabel = normalizeDistanceLabel(row.distanceLabelRaw);
        return !rowDistanceLabel || rowDistanceLabel === targetDistanceLabel;
      })
    : params.protocol.rows;

  if (protocolRows.length === 0) {
    throw new Error("PROTOCOL_FILE_DISTANCE_ROWS_NOT_FOUND");
  }

  const rows = protocolRows.map((row) => ({
    athleteNameRaw: row.athleteNameRaw.trim(),
    finishTimeRaw: row.finishTimeRaw.trim(),
    finishTimeSeconds: parseTimeToSeconds(row.finishTimeRaw),
    ageGroupRaw: row.ageGroupRaw?.trim() || null,
    gender: inferGender(row),
    placementOverall: normalizePlacement(row.placeOverall),
    placementInAgeGroup: normalizePlacement(row.placeAgeGroup),
  }));

  await prisma.eventProtocolRow.deleteMany({
    where: { eventId: params.eventId },
  });

  for (let index = 0; index < rows.length; index += 500) {
    await prisma.eventProtocolRow.createMany({
      data: rows.slice(index, index + 500).map((row) => ({
        eventId: params.eventId,
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

  const groupedRows = new Map<
    string,
    {
      label: string;
      gender: Gender | null;
      finishTimes: number[];
    }
  >();

  for (const row of rows) {
    const groupKey = row.ageGroupRaw || row.gender || "OPEN";
    const group: {
      label: string;
      gender: Gender | null;
      finishTimes: number[];
    } = groupedRows.get(groupKey) ?? {
      label: row.ageGroupRaw || row.gender || "Открытая группа",
      gender: row.gender,
      finishTimes: [],
    };

    if (row.finishTimeSeconds !== null) {
      group.finishTimes.push(row.finishTimeSeconds);
    }

    groupedRows.set(groupKey, group);
  }

  await prisma.protocolGroup.deleteMany({
    where: { eventId: params.eventId },
  });

  for (const [groupKey, group] of groupedRows) {
    group.finishTimes.sort((left, right) => left - right);
    const fifthPlaceTimeSeconds = group.finishTimes[4] ?? null;

    await prisma.protocolGroup.create({
      data: {
        eventId: params.eventId,
        groupKey,
        label: group.label,
        gender: group.gender,
        fifthPlaceTimeSeconds,
        benchmarkSource: fifthPlaceTimeSeconds
          ? BenchmarkSource.PROTOCOL
          : null,
      },
    });
  }

  return {
    eventId: params.eventId,
    organizer: params.protocol.organizer,
    rowsImported: rows.length,
    rowsWithParsedTime: rows.filter((row) => row.finishTimeSeconds !== null)
      .length,
    sourceUrl: params.protocol.sourceUrl,
  } satisfies SourceProtocolImportSummary;
}

export async function importProtocolForEvent(params: {
  eventId: string;
  sourceUrl?: string | null;
  eventName: string;
  eventDate: Date;
  location?: string | null;
  distanceLabel: string;
}) {
  const sourceUrl = params.sourceUrl?.trim();

  if (!sourceUrl) {
    return null;
  }

  const protocol = await fetchNormalizedProtocolFromSource({
    sourceUrl,
    eventName: params.eventName,
    eventDate: formatEventDateInput(params.eventDate),
    location: params.location ?? null,
    distanceLabel: params.distanceLabel,
  });

  if (!protocol) {
    return null;
  }

  return persistNormalizedProtocolForEvent({
    eventId: params.eventId,
    protocol,
    distanceLabel: params.distanceLabel,
  });
}
