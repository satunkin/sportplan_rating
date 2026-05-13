export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const postgresUrl = process.env.DATABASE_URL_POSTGRES?.trim() ?? "";

  if (databaseUrl && !databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  if (postgresUrl) {
    return postgresUrl;
  }

  throw new Error(
    "PostgreSQL runtime requires DATABASE_URL or DATABASE_URL_POSTGRES to be configured.",
  );
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() ?? "SportPlan Rating <no-reply@localhost>";
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const secure = process.env.SMTP_SECURE === "true";

  if (!host || !user || !pass || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    secure,
  };
}

export function getSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    return "cyclon-dev-session-secret";
  }

  throw new Error("SESSION_SECRET must be set in production.");
}
