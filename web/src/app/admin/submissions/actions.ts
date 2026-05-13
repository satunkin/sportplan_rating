"use server";

import { revalidatePath } from "next/cache";

import { reviewSubmission, seedDemoScenario } from "@/lib/db";

export async function approveSubmission(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const categoryKey = String(formData.get("categoryKey") ?? "");
  const fifthPlaceTime = String(formData.get("fifthPlaceTime") ?? "");

  await reviewSubmission(submissionId, "approve", notes, {
    categoryKey,
    fifthPlaceTime,
  });
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
