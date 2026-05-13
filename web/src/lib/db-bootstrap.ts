import Database from "better-sqlite3";

const sqlitePath = "prisma/dev.db";

let bootstrapPromise: Promise<void> | null = null;

function createBootstrapSql() {
  return `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT,
      "telegramId" TEXT,
      "role" TEXT NOT NULL DEFAULT 'ATHLETE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramId_key" ON "User"("telegramId");

    CREATE TABLE IF NOT EXISTS "Athlete" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "middleName" TEXT,
      "birthDate" DATETIME NOT NULL,
      "gender" TEXT NOT NULL,
      "city" TEXT,
      "seasonAgeGroup" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Athlete_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Athlete_userId_key" ON "Athlete"("userId");

    CREATE TABLE IF NOT EXISTS "Season" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Season_name_key" ON "Season"("name");

    CREATE TABLE IF NOT EXISTS "EventCategory" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "discipline" TEXT NOT NULL,
      "categoryKey" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "basePointsDefault" INTEGER NOT NULL,
      "description" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "EventCategory_discipline_categoryKey_key"
      ON "EventCategory"("discipline", "categoryKey");

    CREATE TABLE IF NOT EXISTS "Event" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "eventDate" DATETIME NOT NULL,
      "discipline" TEXT NOT NULL,
      "distanceLabel" TEXT NOT NULL,
      "sourceUrl" TEXT,
      "location" TEXT,
      "categoryId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Event_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "EventCategory" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "Event_eventDate_discipline_idx"
      ON "Event"("eventDate", "discipline");

    CREATE TABLE IF NOT EXISTS "ResultSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "athleteId" TEXT NOT NULL,
      "seasonId" TEXT NOT NULL,
      "eventId" TEXT,
      "eventNameRaw" TEXT NOT NULL,
      "eventDate" DATETIME NOT NULL,
      "discipline" TEXT NOT NULL,
      "distanceLabel" TEXT NOT NULL,
      "ageGroupClaimed" TEXT NOT NULL,
      "finishTimeRaw" TEXT NOT NULL,
      "finishTimeSeconds" INTEGER NOT NULL,
      "protocolUrl" TEXT,
      "bibNumber" TEXT,
      "comment" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING_MANUAL_REVIEW',
      "adminNotes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ResultSubmission_athleteId_fkey"
        FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ResultSubmission_seasonId_fkey"
        FOREIGN KEY ("seasonId") REFERENCES "Season" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ResultSubmission_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "ResultSubmission_athleteId_seasonId_status_idx"
      ON "ResultSubmission"("athleteId", "seasonId", "status");

    CREATE TABLE IF NOT EXISTS "ScoreRule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "seasonId" TEXT NOT NULL,
      "discipline" TEXT NOT NULL,
      "categoryKey" TEXT NOT NULL,
      "eventCategoryId" TEXT,
      "basePoints" INTEGER NOT NULL,
      "formulaVersion" TEXT NOT NULL DEFAULT 'v1',
      "activeFrom" DATETIME,
      "activeTo" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ScoreRule_seasonId_fkey"
        FOREIGN KEY ("seasonId") REFERENCES "Season" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ScoreRule_eventCategoryId_fkey"
        FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "ScoreRule_seasonId_discipline_categoryKey_idx"
      ON "ScoreRule"("seasonId", "discipline", "categoryKey");

    CREATE TABLE IF NOT EXISTS "VerifiedResult" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "athleteId" TEXT NOT NULL,
      "seasonId" TEXT NOT NULL,
      "submissionId" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "eventCategoryId" TEXT,
      "ageGroupUsed" TEXT NOT NULL,
      "fifthPlaceTimeSeconds" INTEGER NOT NULL,
      "lagPercent" DECIMAL NOT NULL,
      "awardedPoints" INTEGER NOT NULL,
      "verificationMode" TEXT NOT NULL,
      "scoreRuleId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VerifiedResult_athleteId_fkey"
        FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VerifiedResult_seasonId_fkey"
        FOREIGN KEY ("seasonId") REFERENCES "Season" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VerifiedResult_submissionId_fkey"
        FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VerifiedResult_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "VerifiedResult_eventCategoryId_fkey"
        FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "VerifiedResult_scoreRuleId_fkey"
        FOREIGN KEY ("scoreRuleId") REFERENCES "ScoreRule" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "VerifiedResult_submissionId_key"
      ON "VerifiedResult"("submissionId");

    CREATE TABLE IF NOT EXISTS "RankingEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "athleteId" TEXT NOT NULL,
      "seasonId" TEXT NOT NULL,
      "totalPoints" INTEGER NOT NULL DEFAULT 0,
      "rank" INTEGER NOT NULL,
      "scoredResultsCount" INTEGER NOT NULL DEFAULT 0,
      "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RankingEntry_athleteId_fkey"
        FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "RankingEntry_seasonId_fkey"
        FOREIGN KEY ("seasonId") REFERENCES "Season" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "RankingEntry_athleteId_seasonId_key"
      ON "RankingEntry"("athleteId", "seasonId");

    CREATE INDEX IF NOT EXISTS "RankingEntry_seasonId_rank_idx"
      ON "RankingEntry"("seasonId", "rank");

    CREATE TABLE IF NOT EXISTS "ManualReview" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "submissionId" TEXT NOT NULL,
      "reviewerId" TEXT NOT NULL,
      "decision" TEXT NOT NULL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ManualReview_submissionId_fkey"
        FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ManualReview_reviewerId_fkey"
        FOREIGN KEY ("reviewerId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "actorUserId" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "payloadJson" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AuditLog_actorUserId_fkey"
        FOREIGN KEY ("actorUserId") REFERENCES "User" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx"
      ON "AuditLog"("entityType", "entityId");
  `;
}

export function ensureDatabaseReady() {
  if (!bootstrapPromise) {
    bootstrapPromise = Promise.resolve().then(() => {
      const db = new Database(sqlitePath);
      db.pragma("journal_mode = WAL");
      db.exec(createBootstrapSql());
      db.close();
    });
  }

  return bootstrapPromise;
}
