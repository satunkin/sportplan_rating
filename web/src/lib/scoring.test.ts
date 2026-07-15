import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCompetitionCoefficient,
  calculateResultPoints,
} from "./scoring.ts";

test("awards the full base and first-place bonus in a large competitive group", () => {
  assert.deepEqual(
    calculateResultPoints({
      basePoints: 600,
      athleteFinishSeconds: 2_400,
      firstPlaceSeconds: 2_400,
      fifthPlaceSeconds: 2_400,
      groupFinishersCount: 11,
      placementInAgeGroup: 1,
    }),
    {
      awardedPoints: 1_320,
      ratingPoints: 600,
      bonusPoints: 720,
      lagPercent: 0,
      competitionCoefficient: 1,
      adjustmentFactor: 1,
      isEligible: true,
    },
  );
});

test("applies the coefficient to both components for 5-10 finishers", () => {
  assert.deepEqual(
    calculateResultPoints({
      basePoints: 600,
      athleteFinishSeconds: 2_700,
      firstPlaceSeconds: 2_400,
      fifthPlaceSeconds: 3_000,
      groupFinishersCount: 8,
      placementInAgeGroup: 2,
    }),
    {
      awardedPoints: 855,
      ratingPoints: 600,
      bonusPoints: 540,
      lagPercent: 0,
      competitionCoefficient: 0.75,
      adjustmentFactor: 0.75,
      isEligible: true,
    },
  );
});

test("does not award points when fewer than five athletes finished", () => {
  const result = calculateResultPoints({
    basePoints: 800,
    athleteFinishSeconds: 4_000,
    firstPlaceSeconds: 3_900,
    fifthPlaceSeconds: null,
    groupFinishersCount: 4,
    placementInAgeGroup: 1,
  });

  assert.equal(result.awardedPoints, 0);
  assert.equal(result.isEligible, false);
});

test("uses consecutive coefficient powers for places two through four", () => {
  const bonuses = [2, 3, 4].map((placementInAgeGroup) =>
    calculateResultPoints({
      basePoints: 500,
      athleteFinishSeconds: 1_000,
      firstPlaceSeconds: 1_000,
      fifthPlaceSeconds: 1_250,
      groupFinishersCount: 11,
      placementInAgeGroup,
    }).bonusPoints,
  );

  assert.deepEqual(bonuses, [450, 338, 253]);
  assert.equal(calculateCompetitionCoefficient(1_000, 1_250), 0.75);
});

test("clamps an anomalous competition coefficient to zero", () => {
  assert.equal(calculateCompetitionCoefficient(1_000, 2_500), 0);
});
