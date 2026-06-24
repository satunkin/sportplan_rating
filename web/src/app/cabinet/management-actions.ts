"use server";

import { EntityStatus } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  addAdminCompetitionDistance,
  approveEntityProposal,
  archiveCompetition,
  createAdminCompetition,
  createDirectoryEntity,
  importAdminCompetitionDistanceProtocol,
  rejectEntityProposal,
  restoreCompetition,
  reviewAthleteLinkRequest,
  setDirectoryEntityStatus,
  updateAdminCompetition,
  updateProtocolGroupBenchmark,
  type UploadedProtocolFileInput,
} from "@/lib/cyclon-service";
import { ensureAdminUser } from "@/lib/db";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";
import { hasAdminSession } from "@/lib/session";

async function requireAdmin() {
  if (!(await hasAdminSession())) redirect("/cabinet/admin-login");
}

function refreshPublicAndAdmin() {
  revalidateTag(PUBLIC_DATA_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/events");
  revalidatePath("/cabinet");
  revalidatePath("/cabinet/competitions");
  revalidatePath("/cabinet/directories");
  revalidatePath("/cabinet/submissions");
}

function collectCompetitionDistances(formData: FormData) {
  const disciplines = formData.getAll("distanceDiscipline").map(String);
  const labels = formData.getAll("distanceLabel").map(String);
  const protocolUrls = formData.getAll("distanceProtocolUrl").map(String);

  return labels
    .map((distanceLabel, index) => ({
      discipline:
        disciplines[index] || String(formData.get("discipline") ?? ""),
      distanceLabel,
      protocolUrl:
        protocolUrls[index] || String(formData.get("protocolUrl") ?? ""),
    }))
    .filter((distance) => distance.distanceLabel.trim());
}

function readUploadedProtocolFileSync(value: FormDataEntryValue) {
  if (!(value instanceof File) || !value.name || value.size === 0) {
    return null;
  }

  return value;
}

async function readUploadedProtocolFile(
  value: FormDataEntryValue | null,
): Promise<UploadedProtocolFileInput | null> {
  const file = readUploadedProtocolFileSync(value ?? "");
  if (!file) return null;

  return {
    fileName: file.name,
    mimeType: file.type,
    buffer: Buffer.from(await file.arrayBuffer()),
  };
}

async function collectCompetitionDistancesWithFiles(formData: FormData) {
  const distances = collectCompetitionDistances(formData);
  const files = await Promise.all(
    formData.getAll("distanceProtocolFile").map(readUploadedProtocolFile),
  );

  return distances.map((distance, index) => ({
    ...distance,
    protocolFile: files[index] ?? null,
  }));
}

function getProtocolImportErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "unknown";

  if (error.message === "PROTOCOL_PDF_IMPORT_NOT_CONFIGURED") return "pdf";
  if (error.message === "PROTOCOL_FILE_HEADER_NOT_FOUND") return "headers";
  if (error.message === "PROTOCOL_FILE_ROWS_NOT_FOUND") return "rows";
  if (error.message === "PROTOCOL_FILE_DISTANCE_COLUMN_REQUIRED") {
    return "distance_column";
  }
  if (error.message === "PROTOCOL_FILE_DISTANCE_ROWS_NOT_FOUND") {
    return "distance_rows";
  }
  if (error.message === "PROTOCOL_FILE_UNSUPPORTED_TYPE") return "type";

  return "unknown";
}

export async function createCompetition(formData: FormData) {
  await requireAdmin();
  const competition = await createAdminCompetition({
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    city: String(formData.get("city") ?? ""),
    seriesName: String(formData.get("seriesName") ?? ""),
    pageUrl: String(formData.get("pageUrl") ?? ""),
    registrationUrl: String(formData.get("registrationUrl") ?? ""),
    resultsUrl: String(formData.get("resultsUrl") ?? ""),
    discipline: String(formData.get("discipline") ?? ""),
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    competitionProtocolFile: await readUploadedProtocolFile(
      formData.get("competitionProtocolFile"),
    ),
    distances: await collectCompetitionDistancesWithFiles(formData),
  });
  refreshPublicAndAdmin();
  redirect(`/cabinet/competitions/${competition.id}/edit`);
}

export async function saveCompetition(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  await updateAdminCompetition(competitionId, {
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    city: String(formData.get("city") ?? ""),
    seriesName: String(formData.get("seriesName") ?? ""),
    pageUrl: String(formData.get("pageUrl") ?? ""),
    registrationUrl: String(formData.get("registrationUrl") ?? ""),
    resultsUrl: String(formData.get("resultsUrl") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect(`/cabinet/competitions/${competitionId}/edit`);
}

export async function addCompetitionDistance(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  await addAdminCompetitionDistance(competitionId, {
    discipline: String(formData.get("discipline") ?? ""),
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    protocolFile: await readUploadedProtocolFile(formData.get("protocolFile")),
  });
  refreshPublicAndAdmin();
  redirect(`/cabinet/competitions/${competitionId}/edit`);
}

export async function uploadDistanceProtocolFile(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const file = await readUploadedProtocolFile(formData.get("protocolFile"));

  if (!file) {
    redirect(`/cabinet/competitions/${competitionId}/edit?protocolError=missing_file`);
  }

  try {
    await importAdminCompetitionDistanceProtocol(eventId, file);
  } catch (error) {
    redirect(
      `/cabinet/competitions/${competitionId}/edit?protocolError=${getProtocolImportErrorCode(error)}`,
    );
  }
  refreshPublicAndAdmin();
  redirect(`/cabinet/competitions/${competitionId}/edit`);
}

export async function saveGroupBenchmark(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  await updateProtocolGroupBenchmark({
    groupId: String(formData.get("groupId") ?? ""),
    fifthPlaceTime: String(formData.get("fifthPlaceTime") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect(`/cabinet/competitions/${competitionId}/edit`);
}

export async function setCompetitionArchived(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  const restore = String(formData.get("restore") ?? "") === "true";
  if (restore) await restoreCompetition(competitionId);
  else await archiveCompetition(competitionId);
  refreshPublicAndAdmin();
  redirect("/cabinet/competitions");
}

export async function createDirectory(formData: FormData) {
  await requireAdmin();
  await createDirectoryEntity({
    type: String(formData.get("type") ?? "") === "coach" ? "coach" : "club",
    name: String(formData.get("name") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/cabinet/directories");
}

export async function changeDirectoryStatus(formData: FormData) {
  await requireAdmin();
  await setDirectoryEntityStatus({
    type: String(formData.get("type") ?? "") === "coach" ? "coach" : "club",
    id: String(formData.get("id") ?? ""),
    status:
      String(formData.get("restore") ?? "") === "true"
        ? EntityStatus.ACTIVE
        : EntityStatus.ARCHIVED,
  });
  refreshPublicAndAdmin();
  redirect("/cabinet/directories");
}

export async function approveProposal(formData: FormData) {
  await requireAdmin();
  const admin = await ensureAdminUser();
  await approveEntityProposal({
    proposalId: String(formData.get("proposalId") ?? ""),
    reviewerUserId: admin.id,
    targetEntityId: String(formData.get("targetEntityId") ?? "") || undefined,
    notes: String(formData.get("notes") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/cabinet/submissions");
}

export async function rejectProposal(formData: FormData) {
  await requireAdmin();
  const admin = await ensureAdminUser();
  await rejectEntityProposal({
    proposalId: String(formData.get("proposalId") ?? ""),
    reviewerUserId: admin.id,
    notes: String(formData.get("notes") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/cabinet/submissions");
}

export async function reviewLinkRequest(formData: FormData) {
  await requireAdmin();
  await reviewAthleteLinkRequest({
    requestId: String(formData.get("requestId") ?? ""),
    approve: String(formData.get("decision") ?? "") === "approve",
    notes: String(formData.get("notes") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/cabinet/submissions");
}
