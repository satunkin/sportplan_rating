"use server";

import { redirect } from "next/navigation";

import { clearAthleteUserSession } from "@/lib/session";

export async function logoutAthlete() {
  await clearAthleteUserSession();
  redirect("/");
}
