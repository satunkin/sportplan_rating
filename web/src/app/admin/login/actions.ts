"use server";

import { redirect } from "next/navigation";

import { setAdminSession } from "@/lib/session";

export type AdminLoginState = {
  errors: string[];
};

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const passphrase = String(formData.get("passphrase") ?? "");

  if (!process.env.ADMIN_ACCESS_KEY) {
    return {
      errors: [
        "ADMIN_ACCESS_KEY не задан. Добавьте его в .env для доступа к админке.",
      ],
    };
  }

  if (passphrase !== process.env.ADMIN_ACCESS_KEY) {
    return {
      errors: ["Неверный ключ доступа администратора."],
    };
  }

  await setAdminSession();
  redirect("/admin/submissions");
}
