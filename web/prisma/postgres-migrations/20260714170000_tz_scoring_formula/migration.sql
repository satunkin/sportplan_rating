ALTER TABLE "ProtocolGroup"
ADD COLUMN "firstPlaceTimeSeconds" INTEGER,
ADD COLUMN "finishersCount" INTEGER;

ALTER TABLE "VerifiedResult"
ALTER COLUMN "fifthPlaceTimeSeconds" DROP NOT NULL,
ALTER COLUMN "lagPercent" DROP NOT NULL,
ADD COLUMN "firstPlaceTimeSeconds" INTEGER,
ADD COLUMN "groupFinishersCount" INTEGER,
ADD COLUMN "ratingPoints" INTEGER,
ADD COLUMN "bonusPoints" INTEGER,
ADD COLUMN "competitionCoefficient" DECIMAL(6, 3),
ADD COLUMN "adjustmentFactor" DECIMAL(6, 3);

UPDATE "ProtocolGroup" AS groups
SET
  "firstPlaceTimeSeconds" = protocol."firstPlaceTimeSeconds",
  "finishersCount" = protocol."finishersCount"
FROM (
  SELECT
    rows."eventId",
    COALESCE(rows."ageGroupRaw", rows."gender"::text, 'OPEN') AS "groupKey",
    MIN(rows."finishTimeSeconds") AS "firstPlaceTimeSeconds",
    COUNT(rows."finishTimeSeconds")::integer AS "finishersCount"
  FROM "EventProtocolRow" AS rows
  WHERE rows."finishTimeSeconds" IS NOT NULL
  GROUP BY
    rows."eventId",
    COALESCE(rows."ageGroupRaw", rows."gender"::text, 'OPEN')
) AS protocol
WHERE
  groups."eventId" = protocol."eventId"
  AND groups."groupKey" = protocol."groupKey";

UPDATE "VerifiedResult"
SET
  "ratingPoints" = "awardedPoints",
  "bonusPoints" = 0,
  "adjustmentFactor" = 1
WHERE "ratingPoints" IS NULL;

UPDATE "ScoreRule"
SET "formulaVersion" = 'v2-tz-bonus';
