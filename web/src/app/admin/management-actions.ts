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
  rejectEntityProposal,
  restoreCompetition,
  reviewAthleteLinkRequest,
  setDirectoryEntityStatus,
  updateAdminCompetition,
  updateProtocolGroupBenchmark,
} from "@/lib/cyclon-service";
import { ensureAdminUser } from "@/lib/db";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";
import { hasAdminSession } from "@/lib/session";

async function requireAdmin() {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

function refreshPublicAndAdmin() {
  revalidateTag(PUBLIC_DATA_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/directories");
  revalidatePath("/admin/submissions");
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
  });
  refreshPublicAndAdmin();
  redirect(`/admin/events/${competition.id}/edit`);
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
  redirect(`/admin/events/${competitionId}/edit`);
}

export async function addCompetitionDistance(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  await addAdminCompetitionDistance(competitionId, {
    discipline: String(formData.get("discipline") ?? ""),
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect(`/admin/events/${competitionId}/edit`);
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
  redirect(`/admin/events/${competitionId}/edit`);
}

export async function setCompetitionArchived(formData: FormData) {
  await requireAdmin();
  const competitionId = String(formData.get("competitionId") ?? "");
  const restore = String(formData.get("restore") ?? "") === "true";
  if (restore) await restoreCompetition(competitionId);
  else await archiveCompetition(competitionId);
  refreshPublicAndAdmin();
  redirect("/admin/events");
}

export async function createDirectory(formData: FormData) {
  await requireAdmin();
  await createDirectoryEntity({
    type: String(formData.get("type") ?? "") === "coach" ? "coach" : "club",
    name: String(formData.get("name") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/admin/directories");
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
  redirect("/admin/directories");
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
  redirect("/admin/submissions");
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
  redirect("/admin/submissions");
}

export async function reviewLinkRequest(formData: FormData) {
  await requireAdmin();
  await reviewAthleteLinkRequest({
    requestId: String(formData.get("requestId") ?? ""),
    approve: String(formData.get("decision") ?? "") === "approve",
    notes: String(formData.get("notes") ?? ""),
  });
  refreshPublicAndAdmin();
  redirect("/admin/submissions");
}
