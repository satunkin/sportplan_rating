-- Additive migration: preserve the existing Event table as the physical
-- competition-distance record while introducing Competition as its parent.

CREATE TYPE "EntityStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "SubmissionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE "BenchmarkSource" AS ENUM ('PROTOCOL', 'ADMIN', 'ATHLETE_HINT');
CREATE TYPE "ProposalType" AS ENUM ('COMPETITION', 'CLUB', 'COACH', 'ATHLETE_LINK');
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED');
CREATE TYPE "TelegramDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "pageUrl" TEXT,
    "registrationUrl" TEXT,
    "resultsUrl" TEXT,
    "seriesId" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProtocolGroup" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "groupKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "gender" "Gender",
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "fifthPlaceTimeSeconds" INTEGER,
    "benchmarkSource" "BenchmarkSource",
    "benchmarkNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProtocolGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "mergedIntoId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "mergedIntoId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AthleteClub" (
    "athleteId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AthleteClub_pkey" PRIMARY KEY ("athleteId", "clubId")
);

CREATE TABLE "AthleteCoach" (
    "athleteId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AthleteCoach_pkey" PRIMARY KEY ("athleteId", "coachId")
);

CREATE TABLE "EntityProposal" (
    "id" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "proposerUserId" TEXT,
    "reviewerUserId" TEXT,
    "targetEntityId" TEXT,
    "payloadJson" JSONB NOT NULL,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EntityProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AthleteLinkRequest" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "telegramUsername" TEXT,
    "requestedAthleteId" TEXT,
    "candidateAthleteId" TEXT,
    "profileJson" JSONB NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AthleteLinkRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramConversation" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT,
    "state" TEXT NOT NULL,
    "dataJson" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramUpdate" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledAt" TIMESTAMP(3),
    CONSTRAINT "TelegramUpdate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelegramNotification" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "TelegramDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramNotification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Athlete"
    ADD COLUMN "telegramUsername" TEXT,
    ADD COLUMN "showTelegramProfile" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "Event"
    ADD COLUMN "competitionId" TEXT,
    ADD COLUMN "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "ResultSubmission"
    ADD COLUMN "submissionType" "SubmissionType" NOT NULL DEFAULT 'CREATE',
    ADD COLUMN "targetVerifiedResultId" TEXT,
    ADD COLUMN "proposedFifthPlaceTimeSeconds" INTEGER;

ALTER TABLE "VerifiedResult"
    ADD COLUMN "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "archivedAt" TIMESTAMP(3);

INSERT INTO "Competition" (
    "id", "name", "eventDate", "city", "resultsUrl", "status", "createdAt", "updatedAt"
)
SELECT
    'cmp_' || md5(
        lower(trim(e."name")) || '|' ||
        e."eventDate"::text || '|' ||
        lower(trim(coalesce(e."location", '')))
    ),
    min(e."name"),
    e."eventDate",
    nullif(min(coalesce(e."location", '')), ''),
    nullif(min(coalesce(e."sourceUrl", '')), ''),
    'ACTIVE'::"EntityStatus",
    min(e."createdAt"),
    max(e."updatedAt")
FROM "Event" e
GROUP BY
    lower(trim(e."name")),
    e."eventDate",
    lower(trim(coalesce(e."location", '')));

UPDATE "Event" e
SET "competitionId" = 'cmp_' || md5(
    lower(trim(e."name")) || '|' ||
    e."eventDate"::text || '|' ||
    lower(trim(coalesce(e."location", '')))
);

WITH ranked_groups AS (
    SELECT
        r."eventId",
        coalesce(nullif(trim(r."ageGroupRaw"), ''), r."gender"::text, 'OPEN') AS group_key,
        coalesce(nullif(trim(r."ageGroupRaw"), ''), r."gender"::text, 'Открытая группа') AS label,
        r."gender",
        r."finishTimeSeconds",
        row_number() OVER (
            PARTITION BY
                r."eventId",
                coalesce(nullif(trim(r."ageGroupRaw"), ''), r."gender"::text, 'OPEN')
            ORDER BY r."finishTimeSeconds" ASC NULLS LAST
        ) AS finish_order
    FROM "EventProtocolRow" r
)
INSERT INTO "ProtocolGroup" (
    "id", "eventId", "groupKey", "label", "gender",
    "fifthPlaceTimeSeconds", "benchmarkSource", "createdAt", "updatedAt"
)
SELECT
    'grp_' || md5(g."eventId" || '|' || g.group_key),
    g."eventId",
    g.group_key,
    min(g.label),
    (array_agg(g."gender") FILTER (WHERE g."gender" IS NOT NULL))[1],
    max(g."finishTimeSeconds") FILTER (WHERE g.finish_order = 5),
    CASE
        WHEN max(g."finishTimeSeconds") FILTER (WHERE g.finish_order = 5) IS NOT NULL
        THEN 'PROTOCOL'::"BenchmarkSource"
        ELSE NULL
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM ranked_groups g
GROUP BY g."eventId", g.group_key;

CREATE UNIQUE INDEX "Series_name_key" ON "Series"("name");
CREATE INDEX "Competition_eventDate_status_idx" ON "Competition"("eventDate", "status");
CREATE INDEX "Competition_seriesId_idx" ON "Competition"("seriesId");
CREATE INDEX "Event_competitionId_idx" ON "Event"("competitionId");
CREATE UNIQUE INDEX "ProtocolGroup_eventId_groupKey_key" ON "ProtocolGroup"("eventId", "groupKey");
CREATE INDEX "ProtocolGroup_eventId_idx" ON "ProtocolGroup"("eventId");
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");
CREATE INDEX "Club_status_idx" ON "Club"("status");
CREATE UNIQUE INDEX "Coach_name_key" ON "Coach"("name");
CREATE INDEX "Coach_status_idx" ON "Coach"("status");
CREATE INDEX "AthleteClub_clubId_idx" ON "AthleteClub"("clubId");
CREATE INDEX "AthleteCoach_coachId_idx" ON "AthleteCoach"("coachId");
CREATE INDEX "EntityProposal_type_status_idx" ON "EntityProposal"("type", "status");
CREATE INDEX "AthleteLinkRequest_telegramId_status_idx" ON "AthleteLinkRequest"("telegramId", "status");
CREATE UNIQUE INDEX "TelegramConversation_telegramId_key" ON "TelegramConversation"("telegramId");
CREATE UNIQUE INDEX "TelegramUpdate_updateId_key" ON "TelegramUpdate"("updateId");
CREATE INDEX "TelegramNotification_status_createdAt_idx" ON "TelegramNotification"("status", "createdAt");
CREATE INDEX "ResultSubmission_targetVerifiedResultId_idx" ON "ResultSubmission"("targetVerifiedResultId");

ALTER TABLE "Competition"
    ADD CONSTRAINT "Competition_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Event"
    ADD CONSTRAINT "Event_competitionId_fkey"
    FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProtocolGroup"
    ADD CONSTRAINT "ProtocolGroup_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResultSubmission"
    ADD CONSTRAINT "ResultSubmission_targetVerifiedResultId_fkey"
    FOREIGN KEY ("targetVerifiedResultId") REFERENCES "VerifiedResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AthleteClub"
    ADD CONSTRAINT "AthleteClub_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AthleteClub"
    ADD CONSTRAINT "AthleteClub_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AthleteCoach"
    ADD CONSTRAINT "AthleteCoach_athleteId_fkey"
    FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AthleteCoach"
    ADD CONSTRAINT "AthleteCoach_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityProposal"
    ADD CONSTRAINT "EntityProposal_proposerUserId_fkey"
    FOREIGN KEY ("proposerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntityProposal"
    ADD CONSTRAINT "EntityProposal_reviewerUserId_fkey"
    FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AthleteLinkRequest"
    ADD CONSTRAINT "AthleteLinkRequest_requestedAthleteId_fkey"
    FOREIGN KEY ("requestedAthleteId") REFERENCES "Athlete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AthleteLinkRequest"
    ADD CONSTRAINT "AthleteLinkRequest_candidateAthleteId_fkey"
    FOREIGN KEY ("candidateAthleteId") REFERENCES "Athlete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TelegramConversation"
    ADD CONSTRAINT "TelegramConversation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Competition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProtocolGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AthleteClub" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AthleteCoach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EntityProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AthleteLinkRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelegramNotification" ENABLE ROW LEVEL SECURITY;
