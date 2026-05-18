ALTER TABLE "Athlete"
ADD COLUMN "publicDisplayName" TEXT;

ALTER TABLE "Athlete"
ADD COLUMN "showPublicResults" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ResultSubmission"
ADD COLUMN "placementOverall" INTEGER;

ALTER TABLE "ResultSubmission"
ADD COLUMN "placementInAgeGroup" INTEGER;
