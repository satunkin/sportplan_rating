"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { reviewSubmission, seedDemoScenario } from "@/lib/db";
import { clearAdminSession } from "@/lib/session";

export async function approveSubmission(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const categoryKey = String(formData.get("categoryKey") ?? "");
  const fifthPlaceTime = String(formData.get("fifthPlaceTime") ?? "");
  const eventLocation = String(formData.get("eventLocation") ?? "");
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
        `/admin/submissions?error=duplicate_verified_submission&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_FIFTH_PLACE_TIME"
    ) {
      redirect(
        `/admin/submissions?error=invalid_fifth_place_time&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "SCORING_INPUT_REQUIRED"
    ) {
      redirect(
        `/admin/submissions?error=missing_scoring_input&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    if (
      error instanceof Error &&
      error.message === "MANUAL_REVIEW_REASON_REQUIRED"
    ) {
      redirect(
        `/admin/submissions?error=manual_review_reason_required&submissionId=${encodeURIComponent(
          submissionId,
        )}`,
      );
    }

    throw error;
  }

  revalidatePath("/admin/submissions");
  revalidatePath("/cabinet");
  revalidatePath("/leaderboard");
}

export async function rejectSubmission(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await reviewSubmission(submissionId, "reject", notes);
  revalidatePath("/admin/submissions");
  revalidatePath("/cabinet");
  revalidatePath("/leaderboard");
}

export async function seedDemoData() {
  await seedDemoScenario();
  revalidatePath("/admin/submissions");
  revalidatePath("/cabinet");
  revalidatePath("/leaderboard");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin/login");
}
