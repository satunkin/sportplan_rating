"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { reviewSubmission } from "@/lib/db";
import { clearAdminSession, hasAdminSession } from "@/lib/session";
import { PUBLIC_DATA_CACHE_TAG } from "@/lib/public-cache";

type InlineReviewResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "duplicate_verified_submission"
        | "invalid_fifth_place_time"
        | "missing_scoring_input"
        | "manual_review_reason_required"
        | "unknown_error";
      message: string;
    };

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

function revalidateModerationViews() {
  revalidatePath("/cabinet/submissions");
  revalidatePath("/cabinet");
  revalidatePublicData();
}

function mapReviewError(error: unknown): InlineReviewResult {
  if (
    error instanceof Error &&
    error.message === "DUPLICATE_VERIFIED_SUBMISSION"
  ) {
    return {
      ok: false,
      code: "duplicate_verified_submission",
      message:
        "У этого спортсмена уже есть подтвержденный дубль. Откройте расширенную карточку и проверьте повтор.",
    };
  }

  if (
    error instanceof Error &&
    error.message === "INVALID_FIFTH_PLACE_TIME"
  ) {
    return {
      ok: false,
      code: "invalid_fifth_place_time",
      message:
        "Не удалось разобрать время 5-го места. Откройте редактирование и укажите корректный формат.",
    };
  }

  if (
    error instanceof Error &&
    error.message === "SCORING_INPUT_REQUIRED"
  ) {
    return {
      ok: false,
      code: "missing_scoring_input",
      message:
        "Для подтверждения не хватает категории или времени 5-го места. Откройте редактирование карточки.",
    };
  }

  if (
    error instanceof Error &&
    error.message === "MANUAL_REVIEW_REASON_REQUIRED"
  ) {
    return {
      ok: false,
      code: "manual_review_reason_required",
      message:
        "Для спорного кейса нужен комментарий модератора. Откройте редактирование карточки.",
    };
  }

  return {
    ok: false,
    code: "unknown_error",
    message: "Не удалось сохранить решение. Попробуйте еще раз.",
  };
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

  revalidateModerationViews();
}

export async function rejectSubmission(formData: FormData) {
  await requireAdminSession();

  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  await reviewSubmission(submissionId, "reject", notes);
  revalidateModerationViews();
}

export async function approveSubmissionInline(
  formData: FormData,
): Promise<InlineReviewResult> {
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

  try {
    await reviewSubmission(submissionId, "approve", notes, {
      categoryKey,
      fifthPlaceTime,
      eventLocation,
      placementOverall,
      placementInAgeGroup,
      moderationFlags: {
        confirmNoPublicProtocol: false,
        confirmMergedAgeGroups: false,
        confirmLessThanFiveFinishers: false,
      },
    });
  } catch (error) {
    return mapReviewError(error);
  }

  revalidateModerationViews();
  return { ok: true };
}

export async function rejectSubmissionInline(
  formData: FormData,
): Promise<InlineReviewResult> {
  await requireAdminSession();

  const submissionId = String(formData.get("submissionId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  try {
    await reviewSubmission(submissionId, "reject", notes);
  } catch (error) {
    return mapReviewError(error);
  }

  revalidateModerationViews();
  return { ok: true };
}

export async function seedDemoData() {
  await requireAdminSession();

  await seedDemoScenario();
  revalidateModerationViews();
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/cabinet/admin-login");
}
