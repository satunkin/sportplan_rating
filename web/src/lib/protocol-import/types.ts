import type { Discipline, Gender } from "@prisma/client";

export type NormalizedProtocolRow = {
  athleteNameRaw: string;
  finishTimeRaw: string;
  ageGroupRaw?: string | null;
  bibNumber?: string | null;
  clubRaw?: string | null;
  country?: string | null;
  genderRaw?: string | null;
  distanceLabelRaw?: string | null;
  paceRaw?: string | null;
  placeStatusRaw?: string | null;
  placeAgeGroup?: number | null;
  placeOverall?: number | null;
  statusRaw?: string | null;
  source?: string | null;
};

export type NormalizedEventProtocol = {
  organizer: string;
  sourceUrl: string;
  eventName: string;
  eventDate: string;
  location?: string | null;
  distanceLabel: string;
  rowCount?: number;
  extractedAt?: string;
  rows: NormalizedProtocolRow[];
};

export type ProtocolImportRequest = {
  organizer: string;
  sourceUrl: string;
  discipline: Discipline;
  eventName: string;
  eventDate: string;
  location?: string | null;
  distanceLabel: string;
  normalizedProtocolPath: string;
  replaceExistingRows?: boolean;
  notes?: string;
  sourceLinks?: Record<string, string>;
};

export type PersistableProtocolRow = {
  athleteNameRaw: string;
  finishTimeRaw: string;
  finishTimeSeconds: number | null;
  ageGroupRaw: string | null;
  gender: Gender | null;
  placementOverall: number | null;
  placementInAgeGroup: number | null;
};
