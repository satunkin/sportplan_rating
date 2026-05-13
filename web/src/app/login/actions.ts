"use server";

import { redirect } from "next/navigation";

import { authenticateAthleteUser, issueAthleteMagicLink } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/runtime-config";
import { setAthleteUserSession } from "@/lib/session";

export type AthleteLoginState = {
  errors: string[];
  info: string | null;
  previewUrl: string | null;
};

export async function loginAthlete(
  _prevState: AthleteLoginState,
  formData: FormData,
): Promise<AthleteLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      errors: ["Укажите email и пароль."],
      info: null,
      previewUrl: null,
    };
  }

  const user = await authenticateAthleteUser(email, password);

  if (!user) {
    return {
      errors: ["Неверный email или пароль."],
      info: null,
      previewUrl: null,
    };
  }

  await setAthleteUserSession(user.id);
  redirect("/cabinet");
}

export async function requestAthleteMagicLink(
  _prevState: AthleteLoginState,
  formData: FormData,
): Promise<AthleteLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return {
      errors: ["Укажите email."],
      info: null,
      previewUrl: null,
    };
  }

  const issuedLink = await issueAthleteMagicLink(email);

  if (issuedLink.token) {
    const magicLinkUrl = `${getAppBaseUrl()}/login/verify?token=${encodeURIComponent(
      issuedLink.token,
    )}`;
    const delivery = await sendMagicLinkEmail({
      email: issuedLink.email,
      magicLinkUrl,
    });

    return {
      errors: [],
      info:
        "Если этот email зарегистрирован, ссылка для входа уже отправлена или подготовлена.",
      previewUrl: delivery.previewUrl,
    };
  }

  return {
    errors: [],
    info:
      "Если этот email зарегистрирован, ссылка для входа уже отправлена или подготовлена.",
    previewUrl: null,
  };
}
