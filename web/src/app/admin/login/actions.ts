"use server";

import { redirect } from "next/navigation";

import { verifyAdminLogin } from "@/lib/admin-auth";
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

  if (!result.success) {
    return {
      errors: [result.error],
    };
  }

  await setAdminSession();
  redirect("/admin/submissions");
}
