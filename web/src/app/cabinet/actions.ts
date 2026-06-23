"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Discipline, Gender } from "@prisma/client";

import { validateAthleteProfile, type AthleteGender } from "@/lib/athlete-profile";
import {
  createAdminAccount,
  createAdminManagedEvent,
  createAthleteByAdmin,
  createSubmissionByAdmin,
  deleteAdminManagedEvent,
  deleteAthleteAccount,
  deleteSubmissionByAdmin,
  deleteSubmissionForUser,
  setAthleteArchiveStatusByAdmin,
  updateAdminManagedEvent,
  updateAthleteByAdmin,
  updateAthletePublicProfile,
  updateSubmissionByAdmin,
  updateSubmissionForUser,
} from "@/lib/db";
import {
  type DisciplineValue,
  validateResultSubmission,
} from "@/lib/result-submission";
import {
  clearAdminSession,
  clearAthleteUserSession,
  getAthleteUserSession,
  hasAdminSession,
} from "@/lib/session";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";

function revalidateAppShell() {
  revalidateTag(PUBLIC_DATA_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/cabinet");
  revalidatePath("/cabinet/events");
  revalidatePath("/cabinet/competitions");
  revalidatePath("/cabinet/athletes");
  revalidatePath("/cabinet/submissions");
  revalidatePath("/leaderboard");
  revalidatePath("/events");
}

async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/cabinet/admin-login");
  }
}

function getAdminSubmissionErrorCode(error: unknown) {
  if (!(error instanceof Error)) {
    return "submission_save_failed";
  }

  if (error.message === "DUPLICATE_SUBMISSION") {
    return "duplicate_submission";
  }

  if (error.message === "DUPLICATE_VERIFIED_SUBMISSION") {
    return "duplicate_verified_submission";
  }

  if (error.message === "SCORING_CATEGORY_REQUIRED" || error.message === "SCORE_RULE_NOT_FOUND") {
    return "scoring_category_required";
  }

  if (error.message === "INVALID_FIFTH_PLACE_TIME") {
    return "invalid_fifth_place_time";
  }

  return "submission_save_failed";
}

export async function logoutAthlete() {
  await clearAthleteUserSession();
  redirect("/");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/cabinet/admin-login");
}

export async function saveAthleteProfileSettings(formData: FormData) {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/login");
  }

  await updateAthletePublicProfile(userId, {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    city: String(formData.get("city") ?? ""),
    publicDisplayName: String(formData.get("publicDisplayName") ?? ""),
    showPublicResults: String(formData.get("showPublicResults") ?? "") === "on",
  });

  revalidateAppShell();
  redirect("/cabinet");
}

export async function removeAthleteAccount() {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/login");
  }

  await deleteAthleteAccount(userId);
  await clearAthleteUserSession();
  revalidateAppShell();
  redirect("/");
}

export async function saveAthleteSubmissionEdit(formData: FormData) {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/login");
  }

  const submissionId = String(formData.get("submissionId") ?? "");
  const validation = validateResultSubmission({
    eventName: String(formData.get("eventName") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    discipline: String(formData.get("discipline") ?? "") as DisciplineValue,
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    categoryKey: String(formData.get("categoryKey") ?? ""),
    ageGroupClaimed: String(formData.get("ageGroupClaimed") ?? ""),
    finishTime: String(formData.get("finishTime") ?? ""),
    fifthPlaceTime: String(formData.get("fifthPlaceTime") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    placementOverall: String(formData.get("placementOverall") ?? ""),
    placementInAgeGroup: String(formData.get("placementInAgeGroup") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!validation.success) {
    redirect(
      `/results/${submissionId}/edit?error=${encodeURIComponent(validation.errors.join(" "))}`,
    );
  }

  await updateSubmissionForUser(userId, submissionId, validation.data);
  revalidateAppShell();
  redirect("/cabinet");
}

export async function removeAthleteSubmission(formData: FormData) {
  const userId = await getAthleteUserSession();

  if (!userId) {
    redirect("/login");
  }

  await deleteSubmissionForUser(userId, String(formData.get("submissionId") ?? ""));
  revalidateAppShell();
  redirect("/cabinet");
}

export async function createCompetitionCard(formData: FormData) {
  await requireAdminSession();

  const discipline = String(formData.get("discipline") ?? "") as Discipline;
  await createAdminManagedEvent({
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    discipline,
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    categoryKey: String(formData.get("categoryKey") ?? "") || undefined,
  });

  revalidateAppShell();
  redirect("/cabinet/events");
}

export async function saveCompetitionCard(formData: FormData) {
  await requireAdminSession();

  const eventId = String(formData.get("eventId") ?? "");
  const discipline = String(formData.get("discipline") ?? "") as Discipline;

  await updateAdminManagedEvent(eventId, {
    name: String(formData.get("name") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    discipline,
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    location: String(formData.get("location") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    categoryKey: String(formData.get("categoryKey") ?? "") || undefined,
  });

  revalidateAppShell();
  redirect(`/cabinet/events/${eventId}/edit`);
}

export async function removeCompetitionCard(formData: FormData) {
  await requireAdminSession();

  await deleteAdminManagedEvent(String(formData.get("eventId") ?? ""));
  revalidateAppShell();
  redirect("/cabinet/events");
}

export async function createAthleteUserByAdmin(formData: FormData) {
  await requireAdminSession();

  const validation = validateAthleteProfile({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    email: String(formData.get("email") ?? ""),
    city: String(formData.get("city") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    gender: String(formData.get("gender") ?? "") as AthleteGender,
  });

  const password = String(formData.get("password") ?? "");

  if (!validation.success || password.trim().length < 8) {
    redirect("/cabinet/athletes?adminError=athlete_create_invalid");
  }

  await createAthleteByAdmin(validation.data, password);
  revalidateAppShell();
  redirect("/cabinet/athletes");
}

export async function createAdminUserByAdmin(formData: FormData) {
  await requireAdminSession();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  await createAdminAccount(email, password);
  revalidateAppShell();
  redirect("/cabinet");
}

export async function saveAthleteByAdmin(formData: FormData) {
  await requireAdminSession();

  const athleteId = String(formData.get("athleteId") ?? "");

  await updateAthleteByAdmin(athleteId, {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    city: String(formData.get("city") ?? ""),
    seasonAgeGroup: String(formData.get("seasonAgeGroup") ?? ""),
    publicDisplayName: String(formData.get("publicDisplayName") ?? ""),
    showPublicResults: String(formData.get("showPublicResults") ?? "") === "on",
    birthDate: String(formData.get("birthDate") ?? ""),
    gender:
      String(formData.get("gender") ?? "") === "FEMALE"
        ? Gender.FEMALE
        : Gender.MALE,
    telegramUsername: String(formData.get("telegramUsername") ?? ""),
    showTelegramProfile:
      String(formData.get("showTelegramProfile") ?? "") === "on",
    clubIds: formData.getAll("clubIds").map(String),
    coachIds: formData.getAll("coachIds").map(String),
  });

  revalidateAppShell();
  redirect(`/cabinet/athletes/${athleteId}`);
}

export async function changeAthleteArchiveStatusByAdmin(formData: FormData) {
  await requireAdminSession();

  const athleteId = String(formData.get("athleteId") ?? "");
  const restore = String(formData.get("restore") ?? "") === "true";
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/cabinet/athletes";

  await setAthleteArchiveStatusByAdmin(athleteId, restore);
  revalidateAppShell();
  redirect(redirectTo);
}

export async function addAthleteSubmissionByAdmin(formData: FormData) {
  await requireAdminSession();

  const athleteId = String(formData.get("athleteId") ?? "");
  const validation = validateResultSubmission({
    eventName: String(formData.get("eventName") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    discipline: String(formData.get("discipline") ?? "") as DisciplineValue,
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    ageGroupClaimed: String(formData.get("ageGroupClaimed") ?? ""),
    finishTime: String(formData.get("finishTime") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    placementOverall: String(formData.get("placementOverall") ?? ""),
    placementInAgeGroup: String(formData.get("placementInAgeGroup") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!validation.success) {
    redirect(`/cabinet/athletes/${athleteId}?error=submission_invalid`);
  }

  try {
    await createSubmissionByAdmin(athleteId, validation.data);
  } catch (error) {
    redirect(
      `/cabinet/athletes/${athleteId}?error=${getAdminSubmissionErrorCode(error)}`,
    );
  }

  revalidateAppShell();
  redirect(`/cabinet/athletes/${athleteId}`);
}

export async function saveAthleteSubmissionByAdmin(formData: FormData) {
  await requireAdminSession();

  const athleteId = String(formData.get("athleteId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const validation = validateResultSubmission({
    eventName: String(formData.get("eventName") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    discipline: String(formData.get("discipline") ?? "") as DisciplineValue,
    distanceLabel: String(formData.get("distanceLabel") ?? ""),
    categoryKey: String(formData.get("categoryKey") ?? ""),
    ageGroupClaimed: String(formData.get("ageGroupClaimed") ?? ""),
    finishTime: String(formData.get("finishTime") ?? ""),
    fifthPlaceTime: String(formData.get("fifthPlaceTime") ?? ""),
    protocolUrl: String(formData.get("protocolUrl") ?? ""),
    placementOverall: String(formData.get("placementOverall") ?? ""),
    placementInAgeGroup: String(formData.get("placementInAgeGroup") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  });

  if (!validation.success) {
    redirect(`/cabinet/athletes/${athleteId}?error=submission_invalid`);
  }

  try {
    await updateSubmissionByAdmin(submissionId, validation.data);
  } catch (error) {
    redirect(
      `/cabinet/athletes/${athleteId}?error=${getAdminSubmissionErrorCode(error)}`,
    );
  }

  revalidateAppShell();
  redirect(`/cabinet/athletes/${athleteId}`);
}

export async function removeAthleteSubmissionByAdmin(formData: FormData) {
  await requireAdminSession();

  const athleteId = String(formData.get("athleteId") ?? "");
  await deleteSubmissionByAdmin(String(formData.get("submissionId") ?? ""));
  revalidateAppShell();
  redirect(`/cabinet/athletes/${athleteId}`);
}
