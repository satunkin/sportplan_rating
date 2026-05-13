import { timingSafeEqual } from "node:crypto";

import {
  createPasswordHash,
  verifyPasswordHash,
} from "@/lib/password-auth";

export type AdminAuthMode = "credentials" | "access_key" | "unconfigured";

type VerifyAdminLoginInput = {
  email: string;
  password: string;
  passphrase: string;
};

function safeEqualText(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getStoredCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim() ?? "";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";

  if (!email || !passwordHash) {
    return null;
  }

  return { email, passwordHash };
}

function parsePasswordHash(passwordHash: string) {
  const [salt, derivedKey] = passwordHash.split(":");

  if (!salt || !derivedKey) {
    return null;
  }

  return { salt, derivedKey };
}

export function getAdminAuthMode(): AdminAuthMode {
  if (getStoredCredentials()) {
    return "credentials";
  }

  if (process.env.ADMIN_ACCESS_KEY?.trim()) {
    return "access_key";
  }

  return "unconfigured";
}

export function getAdminAuthSetupHint() {
  const mode = getAdminAuthMode();

  if (mode === "credentials") {
    return "Вход настроен через ADMIN_EMAIL и ADMIN_PASSWORD_HASH.";
  }

  if (mode === "access_key") {
    return "Сейчас включен dev fallback через ADMIN_ACCESS_KEY. Для production лучше перейти на ADMIN_EMAIL и ADMIN_PASSWORD_HASH.";
  }

  return "Админский вход еще не настроен. Добавьте ADMIN_EMAIL и ADMIN_PASSWORD_HASH либо временно ADMIN_ACCESS_KEY.";
}

export async function createAdminPasswordHash(password: string) {
  return createPasswordHash(password);
}

export async function verifyAdminLogin(input: VerifyAdminLoginInput) {
  const credentials = getStoredCredentials();

  if (credentials) {
    if (!parsePasswordHash(credentials.passwordHash)) {
      return {
        success: false,
        error:
          "ADMIN_PASSWORD_HASH имеет неверный формат. Ожидается salt:hash.",
      };
    }

    const emailMatches = safeEqualText(
      input.email.trim().toLowerCase(),
      credentials.email.toLowerCase(),
    );
    const passwordMatches = await verifyPasswordHash(
      input.password,
      credentials.passwordHash,
    );

    if (emailMatches && passwordMatches) {
      return { success: true as const, mode: "credentials" as const };
    }

    return {
      success: false,
      error: "Неверный email или пароль администратора.",
    };
  }

  const accessKey = process.env.ADMIN_ACCESS_KEY?.trim();

  if (accessKey && safeEqualText(input.passphrase, accessKey)) {
    return { success: true as const, mode: "access_key" as const };
  }

  if (accessKey) {
    return {
      success: false,
      error: "Неверный ключ доступа администратора.",
    };
  }

  return {
    success: false,
    error:
      "Админский вход не настроен. Добавьте ADMIN_EMAIL и ADMIN_PASSWORD_HASH либо временно ADMIN_ACCESS_KEY.",
  };
}
