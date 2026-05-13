import { cookies } from "next/headers";

const ATHLETE_USER_ID_COOKIE = "cyclon-athlete-user-id";
const ADMIN_SESSION_COOKIE = "cyclon-admin-session";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function setAthleteUserSession(userId: string) {
  const store = await cookies();
  store.set(ATHLETE_USER_ID_COOKIE, userId, baseCookieOptions);
}

export async function getAthleteUserSession() {
  const store = await cookies();
  return store.get(ATHLETE_USER_ID_COOKIE)?.value ?? null;
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "1", baseCookieOptions);
}

export async function hasAdminSession() {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE)?.value === "1";
}
