import assert from "node:assert/strict";
import test from "node:test";

import {
  getProtocolGroupSection,
  groupProtocolRows,
  inferProtocolGender,
  splitProtocolGroupsForDisplay,
} from "./protocol-groups.ts";

test("supports two broad male and female groups", () => {
  const groups = groupProtocolRows([
    { ageGroupRaw: null, gender: "MALE", finishTimeSeconds: 100 },
    { ageGroupRaw: null, gender: "FEMALE", finishTimeSeconds: 110 },
  ]);

  assert.deepEqual(
    groups.map(({ groupKey, label }) => ({ groupKey, label })),
    [
      { groupKey: "MALE", label: "Мужчины" },
      { groupKey: "FEMALE", label: "Женщины" },
    ],
  );
});

test("preserves standard age groups from the organizer", () => {
  const groups = groupProtocolRows([
    { ageGroupRaw: "М 30-34", gender: "MALE", finishTimeSeconds: 100 },
    { ageGroupRaw: "Ж 30-34", gender: "FEMALE", finishTimeSeconds: 120 },
  ]);

  assert.deepEqual(groups.map((group) => group.groupKey), ["М 30-34", "Ж 30-34"]);
});

test("keeps a single absolute group even when participant gender is known", () => {
  const groups = groupProtocolRows([
    { ageGroupRaw: "Абсолют", gender: "MALE", finishTimeSeconds: 100 },
    { ageGroupRaw: "Абсолют", gender: "FEMALE", finishTimeSeconds: 110 },
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].groupKey, "Абсолют");
  assert.deepEqual(groups[0].finishTimes, [100, 110]);
});

test("separates nonstandard ranges when gender is stored in another column", () => {
  const groups = groupProtocolRows([
    { ageGroupRaw: "до 30 лет", gender: "MALE", finishTimeSeconds: 100 },
    { ageGroupRaw: "до 30 лет", gender: "FEMALE", finishTimeSeconds: 120 },
    { ageGroupRaw: "30-45 лет", gender: "MALE", finishTimeSeconds: 130 },
  ]);

  assert.deepEqual(groups.map((group) => group.groupKey), [
    "MALE:до 30 лет",
    "FEMALE:до 30 лет",
    "MALE:30-45 лет",
  ]);
});

test("recognizes gender inside elite and para labels and displays them separately", () => {
  assert.equal(inferProtocolGender({ ageGroupRaw: "Элита мужчины" }), "MALE");
  assert.equal(inferProtocolGender({ ageGroupRaw: "Элита женщины" }), "FEMALE");
  assert.equal(inferProtocolGender({ ageGroupRaw: "Параатлеты мужчины" }), "MALE");
  assert.equal(
    getProtocolGroupSection({ label: "Элита мужчины", gender: "MALE" }),
    "special",
  );
});

test("orders display sections as men, women, special, absolute", () => {
  const sections = splitProtocolGroupsForDisplay([
    { label: "Ж 30-34", gender: "FEMALE" as const },
    { label: "Абсолют", gender: null },
    { label: "Элита мужчины", gender: "MALE" as const },
    { label: "М 30-34", gender: "MALE" as const },
  ]);

  assert.deepEqual(sections.map((section) => section.key), [
    "male",
    "female",
    "special",
    "absolute",
  ]);
});
