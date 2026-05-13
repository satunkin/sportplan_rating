import { getAdminAuthMode } from "@/lib/admin-auth";
import { ensureDatabaseReady } from "@/lib/db-bootstrap";
import {
  getAppBaseUrl,
  getSessionSecret,
  getSmtpConfig,
} from "@/lib/runtime-config";

export type DeploymentReadinessReport = {
  blockers: string[];
  warnings: string[];
};

function isLocalhostUrl(value: string) {
  return value.includes("localhost") || value.includes("127.0.0.1");
}

export async function getDeploymentReadinessReport() {
  const blockers: string[] = [];
  const warnings: string[] = [];

  try {
    await ensureDatabaseReady();
  } catch (error) {
    blockers.push(
      error instanceof Error ? error.message : "Database readiness check failed.",
    );
  }

  try {
    getSessionSecret();
  } catch (error) {
    blockers.push(
      error instanceof Error ? error.message : "SESSION_SECRET is not configured.",
    );
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const directUrl = process.env.DIRECT_URL ?? "";

  if (!databaseUrl) {
    blockers.push("DATABASE_URL is not configured.");
  } else if (databaseUrl.startsWith("file:")) {
    blockers.push(
      "Hosted deployment requires PostgreSQL. Replace file: DATABASE_URL with a reachable PostgreSQL connection string.",
    );
  }

  if (!directUrl) {
    warnings.push(
      "DIRECT_URL is not configured. Prisma CLI and migrations are safer with a direct PostgreSQL connection separate from the runtime pooler URL.",
    );
  }

  const appBaseUrl = getAppBaseUrl();

  if (!appBaseUrl) {
    blockers.push("APP_BASE_URL is not configured.");
  } else if (isLocalhostUrl(appBaseUrl)) {
    blockers.push(
      "APP_BASE_URL still points to localhost. Set it to the public site URL before hosted deployment.",
    );
  }

  if (!getSmtpConfig()) {
    blockers.push(
      "SMTP is not fully configured. Magic-link login needs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, and EMAIL_FROM.",
    );
  }

  const adminAuthMode = getAdminAuthMode();

  if (adminAuthMode === "unconfigured") {
    blockers.push(
      "Admin auth is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH before deployment.",
    );
  } else if (adminAuthMode === "access_key") {
    warnings.push(
      "Admin login still uses ADMIN_ACCESS_KEY fallback. Prefer ADMIN_EMAIL and ADMIN_PASSWORD_HASH for production.",
    );
  }

  return {
    blockers,
    warnings,
  } satisfies DeploymentReadinessReport;
}
