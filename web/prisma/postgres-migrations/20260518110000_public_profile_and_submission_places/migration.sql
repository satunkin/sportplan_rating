ALTER TABLE "Athlete"
ADD COLUMN "publicDisplayName" TEXT,
ADD COLUMN "showPublicResults" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ResultSubmission"
ADD COLUMN "placementOverall" INTEGER,
ADD COLUMN "placementInAgeGroup" INTEGER;
