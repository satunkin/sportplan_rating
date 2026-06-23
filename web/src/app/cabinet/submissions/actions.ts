"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { reviewSubmission, seedDemoScenario } from "@/lib/db";
import { clearAdminSession, hasAdminSession } from "@/lib/session";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";

function revalidatePublicData() {
  revalidateTag(PUBLIC_DATA_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/leaderboard");
}

async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/cabinet/admin-login");
  }
}

export async function approveSubmission(formData: FormData) {
  await requireAdminSession();

  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const categoryKey = String(formData.get("categoryKey") ?? "");
  const fifthPlaceTime = String(formData.get("fifthPlaceTime") ?? "");
  const eventLocation = String(formData.get("eventLocation") ?? "");
  const placementOverall = String(formData.get("placementOverall") ?? "");
  const placementInAgeGroup = String(
    formData.get("placementInAgeGroup") ?? "",
  );
  const confirmNoPublicProtocol =
    String(formData.get("confirmNoPublicProtocol") ?? "") === "on";
  const confirmMergedAgeGroups =
    String(formData.get("confirmMergedAgeGroups") ?? "") === "on";
  const confirmLessThanFiveFinishers =
    String(formData.get("confirmLessThanFiveFinishers") ?? "") === "on";

  try {
    await reviewSubmission(submissionId, "approve", notes, {
      categoryKey,
      fifthPlaceTime,
      eventLocation,
      placementOverall,
      placementInAgeGroup,
      moderationFlags: {
        confirmNoPublicProtocol,
        confirmMergedAgeGroups,
        confirmLessThanFiveFinishers,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "DUPLICATE_VERIFIED_SUBMISSION"
    ) {
      redirect(
        `/cabinet/submissions?error=duplicate_verified_submission&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_FIFTH_PLACE_TIME"
    ) {
      redirect(
        `/cabinet/submissions?error=invalid_fifth_place_time&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "SCORING_INPUT_REQUIRED"
    ) {
      redirect(
        `/cabinet/submissions?error=missing_scoring_input&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "MANUAL_REVIEW_REASON_REQUIRED"
    ) {
      redirect(
        `/cabinet/submissions?error=manual_review_reason_required&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    throw error;
  }

  revalidatePath("/cabinet/submissions");
  revalidatePath("/cabinet");
  revalidatePublicData();
}

export async function rejectSubmission(formData: FormData) {
  await requireAdminSession();

  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await reviewSubmission(submissionId, "reject", notes);
  revalidatePath("/cabinet/submissions");
  revalidatePath("/cabinet");
  revalidatePublicData();
}

export async function seedDemoData() {
  await requireAdminSession();

  await seedDemoScenario();
  revalidatePath("/cabinet/submissions");
  revalidatePath("/cabinet");
  revalidatePublicData();
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/cabinet/admin-login");
}
