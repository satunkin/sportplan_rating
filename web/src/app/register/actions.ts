"use server";

import { redirect } from "next/navigation";

import {
  type AthleteGender,
  validateAthleteProfile,
} from "@/lib/athlete-profile";
import { upsertAthleteProfile } from "@/lib/db";
import { setAthleteUserSession } from "@/lib/session";

export type RegisterState = {
  errors: string[];
};

export async function registerAthlete(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const result = validateAthleteProfile({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    email: String(formData.get("email") ?? ""),
    city: String(formData.get("city") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    gender: String(formData.get("gender") ?? "") as AthleteGender,
  });

  if (!result.success) {
    return { errors: result.errors };
  }

  const password = String(formData.get("password") ?? "").trim();

  if (password.length < 8) {
    return {
      errors: ["Пароль должен быть не короче 8 символов."],
    };
  }

  try {
    const { user } = await upsertAthleteProfile(result.data, password);
    await setAthleteUserSession(user.id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_REGISTERED"
    ) {
      return {
        errors: [
          "Этот email уже зарегистрирован. Войдите через страницу входа участника.",
        ],
      };
    }

    throw error;
  }
  redirect("/cabinet");
}
