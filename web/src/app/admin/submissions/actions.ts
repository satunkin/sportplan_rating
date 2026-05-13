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

  try {
    await reviewSubmission(submissionId, "approve", notes, {
      categoryKey,
      fifthPlaceTime,
      eventLocation,
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
