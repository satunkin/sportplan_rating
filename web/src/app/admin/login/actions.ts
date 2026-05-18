"use server";

import { redirect } from "next/navigation";

import { verifyAdminLogin } from "@/lib/admin-auth";
import { authenticateAdminUser, ensureAdminUser } from "@/lib/db";
import { setAdminSession } from "@/lib/session";

export type AdminLoginState = {
  errors: string[];
};

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const result = await verifyAdminLogin({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passphrase: String(formData.get("passphrase") ?? ""),
  });

  if (result.success) {
    const adminUser = await ensureAdminUser();
    await setAdminSession(adminUser.id);
    redirect("/cabinet");
  }

  const dbAdmin = await authenticateAdminUser(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );

  if (!dbAdmin) {
    return {
      errors: [result.error],
    };
  }

  await setAdminSession(dbAdmin.id);
  redirect("/cabinet");
}
