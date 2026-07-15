import { BenchmarkSource } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  groupProtocolRows,
  inferProtocolGender,
} from "@/lib/protocol-groups";
import { fetchNormalizedProtocolFromSource } from "@/lib/protocol-import/parser-runtime.mjs";
import { parseTimeToSeconds } from "@/lib/time";
import type {
  NormalizedEventProtocol,
} from "@/lib/protocol-import/types";

type SourceProtocolImportSummary = {
  eventId: string;
  organizer: string;
  rowsImported: number;
  rowsWithParsedTime: number;
  sourceUrl: string;
};

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
    gender: inferProtocolGender(row),
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

  const groupedRows = groupProtocolRows(rows);

  await prisma.protocolGroup.deleteMany({
    where: { eventId: params.eventId },
  });

  for (const group of groupedRows) {
    group.finishTimes.sort((left, right) => left - right);
    const firstPlaceTimeSeconds = group.finishTimes[0] ?? null;
    const fifthPlaceTimeSeconds = group.finishTimes[4] ?? null;

    await prisma.protocolGroup.create({
      data: {
        eventId: params.eventId,
        groupKey: group.groupKey,
        label: group.label,
        gender: group.gender,
        firstPlaceTimeSeconds,
        fifthPlaceTimeSeconds,
        finishersCount: group.finishTimes.length,
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
