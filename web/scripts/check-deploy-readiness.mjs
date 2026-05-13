import "dotenv/config";

const blockers = [];
const warnings = [];

const databaseUrl = process.env.DATABASE_URL ?? "";
const directUrl = process.env.DIRECT_URL ?? "";
const appBaseUrl = process.env.APP_BASE_URL ?? "";
const smtpHost = process.env.SMTP_HOST ?? "";
const smtpPort = process.env.SMTP_PORT ?? "";
const smtpUser = process.env.SMTP_USER ?? "";
const smtpPass = process.env.SMTP_PASS ?? "";
const smtpSecure = process.env.SMTP_SECURE ?? "";
const sessionSecret = process.env.SESSION_SECRET ?? "";
const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
const adminAccessKey = process.env.ADMIN_ACCESS_KEY ?? "";

if (!databaseUrl) {
  blockers.push("DATABASE_URL is missing.");
} else if (databaseUrl.startsWith("file:")) {
  blockers.push(
    "DATABASE_URL still points to SQLite. Hosted deployment requires PostgreSQL.",
  );
}

if (!sessionSecret) {
  blockers.push("SESSION_SECRET is missing.");
}

if (!appBaseUrl) {
  blockers.push("APP_BASE_URL is missing.");
} else if (
  appBaseUrl.includes("localhost") ||
  appBaseUrl.includes("127.0.0.1")
) {
  blockers.push("APP_BASE_URL still points to localhost.");
}

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpSecure) {
  blockers.push(
    "SMTP config is incomplete. Need SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, and EMAIL_FROM.",
  );
}

if (!adminEmail || !adminPasswordHash) {
  if (adminAccessKey) {
    warnings.push(
      "Admin auth will fall back to ADMIN_ACCESS_KEY. Prefer ADMIN_EMAIL + ADMIN_PASSWORD_HASH for production.",
    );
  } else {
    blockers.push(
      "Admin auth is not fully configured. Need ADMIN_EMAIL and ADMIN_PASSWORD_HASH.",
    );
  }
}

if (!directUrl) {
  warnings.push(
    "DIRECT_URL is missing. Prisma CLI and migrations are safer with a direct PostgreSQL connection.",
  );
}

if (blockers.length === 0) {
  console.log("Deployment readiness check passed.");
} else {
  console.error("Deployment readiness check failed.");
  for (const blocker of blockers) {
    console.error(`- ${blocker}`);
  }
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (blockers.length > 0) {
  process.exitCode = 1;
}
