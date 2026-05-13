-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ATHLETE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('RUNNING', 'CYCLING', 'SWIMMING', 'TRIATHLON');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING_AUTO_CHECK', 'PENDING_MANUAL_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationMode" AS ENUM ('AUTO', 'SEMI_AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "telegramId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ATHLETE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "city" TEXT,
    "seasonAgeGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "basePointsDefault" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "distanceLabel" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "location" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProtocolRow" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "athleteNameRaw" TEXT NOT NULL,
    "gender" "Gender",
    "ageGroupRaw" TEXT,
    "finishTimeRaw" TEXT NOT NULL,
    "finishTimeSeconds" INTEGER,
    "placementOverall" INTEGER,
    "placementInAgeGroup" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventProtocolRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultSubmission" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "eventId" TEXT,
    "eventNameRaw" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "distanceLabel" TEXT NOT NULL,
    "ageGroupClaimed" TEXT NOT NULL,
    "finishTimeRaw" TEXT NOT NULL,
    "finishTimeSeconds" INTEGER NOT NULL,
    "protocolUrl" TEXT,
    "bibNumber" TEXT,
    "comment" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING_MANUAL_REVIEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedResult" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventCategoryId" TEXT,
    "ageGroupUsed" TEXT NOT NULL,
    "fifthPlaceTimeSeconds" INTEGER NOT NULL,
    "lagPercent" DECIMAL(65,30) NOT NULL,
    "awardedPoints" INTEGER NOT NULL,
    "verificationMode" "VerificationMode" NOT NULL,
    "scoreRuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreRule" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "eventCategoryId" TEXT,
    "basePoints" INTEGER NOT NULL,
    "formulaVersion" TEXT NOT NULL DEFAULT 'v1',
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingEntry" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL,
    "scoredResultsCount" INTEGER NOT NULL DEFAULT 0,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualReview" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLinkToken_userId_expiresAt_idx" ON "MagicLinkToken"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProtocolRow" ADD CONSTRAINT "EventProtocolRow_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSubmission" ADD CONSTRAINT "ResultSubmission_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSubmission" ADD CONSTRAINT "ResultSubmission_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSubmission" ADD CONSTRAINT "ResultSubmission_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedResult" ADD CONSTRAINT "VerifiedResult_scoreRuleId_fkey" FOREIGN KEY ("scoreRuleId") REFERENCES "ScoreRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRule" ADD CONSTRAINT "ScoreRule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreRule" ADD CONSTRAINT "ScoreRule_eventCategoryId_fkey" FOREIGN KEY ("eventCategoryId") REFERENCES "EventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingEntry" ADD CONSTRAINT "RankingEntry_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReview" ADD CONSTRAINT "ManualReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ResultSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualReview" ADD CONSTRAINT "ManualReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
