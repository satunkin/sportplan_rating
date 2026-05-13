-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "telegramId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ATHLETE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Athlete" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discipline" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "basePointsDefault" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "discipline" TEXT NOT NULL,
    "distanceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "location" TEXT,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventProtocolRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "athleteNameRaw" TEXT NOT NULL,
    "gender" TEXT,
    "ageGroupRaw" TEXT,
    "finishTimeRaw" TEXT NOT NULL,
    "finishTimeSeconds" INTEGER,
    "placementOverall" INTEGER,
    "placementInAgeGroup" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventProtocolRow_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResultSubmission" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResultSubmission_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultSubmission_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResultSubmission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerifiedResult" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VerifiedResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerifiedResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerifiedResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerifiedResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VerifiedResult_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VerifiedResult_scoreRuleId_fkey" FOREIGN KEY ("scoreRuleId") REFERENCES "ScoreRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreRule" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScoreRule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoreRule_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "athleteId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "scoredResultsCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RankingEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RankingEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManualReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_userId_key" ON "Athlete"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_discipline_categoryKey_key" ON "EventCategory"("discipline", "categoryKey");

-- CreateIndex
CREATE INDEX "Event_eventDate_discipline_idx" ON "Event"("eventDate", "discipline");

-- CreateIndex
CREATE INDEX "ResultSubmission_athleteId_seasonId_status_idx" ON "ResultSubmission"("athleteId", "seasonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedResult_submissionId_key" ON "VerifiedResult"("submissionId");

-- CreateIndex
CREATE INDEX "ScoreRule_seasonId_discipline_categoryKey_idx" ON "ScoreRule"("seasonId", "discipline", "categoryKey");

-- CreateIndex
CREATE INDEX "RankingEntry_seasonId_rank_idx" ON "RankingEntry"("seasonId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "RankingEntry_athleteId_seasonId_key" ON "RankingEntry"("athleteId", "seasonId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
