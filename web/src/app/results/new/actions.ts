"use server";

import { redirect } from "next/navigation";

import {
  type DisciplineValue,
  validateResultSubmission,
} from "@/lib/result-submission";
import { createResultSubmissionForUser } from "@/lib/db";
import { getAthleteUserSession } from "@/lib/session";

export type ResultSubmissionState = {
  errors: string[];
};

export async function submitResult(
  _prevState: ResultSubmissionState,
  formData: FormData,
): Promise<ResultSubmissionState> {
  const userId = await getAthleteUserSession();

  if (!userId) {
    return {
      errors: ["Сначала нужно зарегистрировать профиль спортсмена."],
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
    comment: String(formData.get("comment") ?? ""),
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  await createResultSubmissionForUser(userId, result.data);

  redirect("/cabinet");
}
