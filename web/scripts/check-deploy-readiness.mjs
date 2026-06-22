import "dotenv/config";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  getAppBaseUrl,
  getDirectDatabaseUrl,
  getRuntimeDatabaseUrl,
  getSmtpConfig,
  isLocalhostUrl,
  isSmtpConfigured,
} from "./lib/runtime-env.mjs";

const blockers = [];
const warnings = [];

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const runtimeDatabaseUrl = getRuntimeDatabaseUrl();
const directUrl = getDirectDatabaseUrl();
const appBaseUrl = getAppBaseUrl();
const smtp = getSmtpConfig();
const sessionSecret = process.env.SESSION_SECRET ?? "";
const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
const adminAccessKey = process.env.ADMIN_ACCESS_KEY ?? "";
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
const telegramWebhookSecret =
  process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
const REQUIRED_TABLES = [
  "_prisma_migrations",
  "User",
  "Athlete",
  "ResultSubmission",
  "VerifiedResult",
  "RankingEntry",
  "Competition",
  "TelegramConversation",
  "TelegramUpdate",
];
const REQUIRED_RLS_TABLES = [
  "User",
  "Athlete",
  "Season",
  "EventCategory",
  "Event",
  "EventProtocolRow",
  "ResultSubmission",
  "VerifiedResult",
  "ScoreRule",
  "RankingEntry",
  "ManualReview",
  "AuditLog",
  "MagicLinkToken",
  "Series",
  "Competition",
  "ProtocolGroup",
  "Club",
  "Coach",
  "AthleteClub",
  "AthleteCoach",
  "EntityProposal",
  "AthleteLinkRequest",
  "TelegramConversation",
  "TelegramUpdate",
  "TelegramNotification",
];

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

if (!telegramBotToken) {
  blockers.push("TELEGRAM_BOT_TOKEN is missing.");
}

if (!telegramWebhookSecret) {
  blockers.push("TELEGRAM_WEBHOOK_SECRET is missing.");
}

if (!appBaseUrl) {
  blockers.push("APP_BASE_URL is missing.");
} else if (isLocalhostUrl(appBaseUrl)) {
  blockers.push("APP_BASE_URL still points to localhost.");
}

if (!isSmtpConfigured()) {
  warnings.push(
    "SMTP is not configured. Telegram and admin password login will work, but the legacy athlete magic-link login will be unavailable.",
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

async function verifyDatabaseConnectivity() {
  if (!runtimeDatabaseUrl) {
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: runtimeDatabaseUrl,
    }),
  });

  try {
    await prisma.$queryRawUnsafe("SELECT 1");

    const missingTables = [];

    for (const tableName of REQUIRED_TABLES) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`);
      } catch {
        missingTables.push(tableName);
      }
    }

    if (missingTables.length > 0) {
      blockers.push(
        `Database connection works, but Prisma tables are missing: ${missingTables.join(", ")}. Run "npm run db:deploy" before deployment.`,
      );
      return;
    }

    const tablesWithoutRls = [];

    for (const tableName of REQUIRED_RLS_TABLES) {
      const result = await prisma.$queryRawUnsafe(`
        SELECT c.relrowsecurity AS "rowSecurityEnabled"
        FROM pg_class AS c
        INNER JOIN pg_namespace AS n
          ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind = 'r'
          AND c.relname = '${tableName}'
        LIMIT 1
      `);
      const rowSecurityEnabled = result[0]?.rowSecurityEnabled;

      if (rowSecurityEnabled !== true) {
        tablesWithoutRls.push(tableName);
      }
    }

    if (tablesWithoutRls.length > 0) {
      blockers.push(
        `RLS is disabled on public tables: ${tablesWithoutRls.join(", ")}. Run "npm run db:deploy" (or apply the matching Prisma migration in Supabase SQL Editor) before deployment.`,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PostgreSQL error.";

    blockers.push(`PostgreSQL connectivity check failed: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifySmtpConnectivity() {
  if (!isSmtpConfigured()) {
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  try {
    await transport.verify();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown SMTP error.";

    blockers.push(`SMTP connectivity check failed: ${message}`);
  }
}

await verifyDatabaseConnectivity();
await verifySmtpConnectivity();

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
