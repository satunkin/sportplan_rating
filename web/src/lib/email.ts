import nodemailer from "nodemailer";

import { getAppBaseUrl, getEmailFrom, getSmtpConfig } from "@/lib/runtime-config";

type SendMagicLinkEmailInput = {
  email: string;
  magicLinkUrl: string;
};

export type SendMagicLinkEmailResult = {
  previewUrl: string | null;
};

export async function sendMagicLinkEmail({
  email,
  magicLinkUrl,
}: SendMagicLinkEmailInput): Promise<SendMagicLinkEmailResult> {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, and APP_BASE_URL.",
      );
    }

    return {
      previewUrl: magicLinkUrl,
    };
  }

  const transport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  await transport.sendMail({
    from: getEmailFrom(),
    to: email,
    subject: "Вход в SportPlan Rating",
    text: [
      "Здравствуйте!",
      "",
      "Откройте ссылку ниже, чтобы войти в кабинет спортсмена:",
      magicLinkUrl,
      "",
      "Ссылка действует 30 минут и используется только один раз.",
      "",
      `Если вы не запрашивали вход, просто проигнорируйте это письмо. ${getAppBaseUrl()}`,
    ].join("\n"),
  });

  return {
    previewUrl: null,
  };
}
