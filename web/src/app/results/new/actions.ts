"use server";

import { redirect } from "next/navigation";

import {
  type DisciplineValue,
  type ResultSubmissionFieldErrors,
  validateResultSubmission,
} from "@/lib/result-submission";
import { createResultSubmissionForUser } from "@/lib/db";
import { getAthleteUserSession } from "@/lib/session";

export type ResultSubmissionState = {
  errors: string[];
  fieldErrors: ResultSubmissionFieldErrors;
};

export async function submitResult(
  _prevState: ResultSubmissionState,
  formData: FormData,
): Promise<ResultSubmissionState> {
  const userId = await getAthleteUserSession();

  if (!userId) {
    return {
      errors: ["Сначала нужно зарегистрировать профиль спортсмена."],
      fieldErrors: {},
    };
  }

  const result = validateResultSubmission({
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

  if (!result.success) {
    return { errors: result.errors, fieldErrors: result.fieldErrors };
  }

  try {
    await createResultSubmissionForUser(userId, result.data);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "DUPLICATE_SUBMISSION"
    ) {
      return {
        errors: [
          "Похожий результат уже отправлен в очередь или уже подтвержден. Откройте кабинет и проверьте текущие заявки, чтобы не задублировать старт.",
        ],
        fieldErrors: {},
      };
    }

    throw error;
  }

  redirect("/cabinet");
}
