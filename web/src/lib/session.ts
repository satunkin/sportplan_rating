import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/runtime-config";

const ATHLETE_USER_ID_COOKIE = "cyclon-athlete-user-id";
const ADMIN_SESSION_COOKIE = "cyclon-admin-session";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

type SessionPayload =
  | {
      role: "athlete";
      sub: string;
    }
  | {
      role: "admin";
      sub: string;
    };

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function createSessionToken(payload: SessionPayload) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function createAthleteSessionCookie(userId: string) {
  return {
    name: ATHLETE_USER_ID_COOKIE,
    value: createSessionToken({ role: "athlete", sub: userId }),
    options: baseCookieOptions,
  };
}

export function createAdminSessionCookie(userId = "admin") {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: createSessionToken({ role: "admin", sub: userId }),
    options: baseCookieOptions,
  };
}

function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const provided = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;

    if (
      parsed.role === "athlete" &&
      typeof parsed.sub === "string" &&
      parsed.sub.length > 0
    ) {
      return parsed;
    }

    if (
      parsed.role === "admin" &&
      typeof parsed.sub === "string" &&
      parsed.sub.length > 0
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export async function setAthleteUserSession(userId: string) {
  const store = await cookies();
  const cookie = createAthleteSessionCookie(userId);
  store.set(cookie.name, cookie.value, cookie.options);
}

export async function getAthleteUserSession() {
  const store = await cookies();
  const payload = parseSessionToken(store.get(ATHLETE_USER_ID_COOKIE)?.value);
  return payload?.role === "athlete" ? payload.sub : null;
}

export async function setAdminSession(userId = "admin") {
  const store = await cookies();
  const cookie = createAdminSessionCookie(userId);
  store.set(cookie.name, cookie.value, cookie.options);
}

export async function hasAdminSession() {
  const store = await cookies();
  const payload = parseSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  return payload?.role === "admin";
}

export async function getAdminUserSession() {
  const store = await cookies();
  const payload = parseSessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  return payload?.role === "admin" ? payload.sub : null;
}

export async function clearAthleteUserSession() {
  const store = await cookies();
  store.delete(ATHLETE_USER_ID_COOKIE);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}
