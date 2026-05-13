import { NextResponse } from "next/server";

import { consumeAthleteMagicLink } from "@/lib/db";
import { createAthleteSessionCookie } from "@/lib/session";

function buildRedirectUrl(request: Request, error?: string) {
  const url = new URL("/login", request.url);

  if (error) {
    url.searchParams.set("magicLinkError", error);
  }

  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "Ссылка для входа неполная или повреждена."),
    );
  }

  const user = await consumeAthleteMagicLink(token);

  if (!user) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        "Ссылка для входа недействительна или уже использована. Запросите новую.",
      ),
    );
  }

  const response = NextResponse.redirect(new URL("/cabinet", request.url));
  const cookie = createAthleteSessionCookie(user.id);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
