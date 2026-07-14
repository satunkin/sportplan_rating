export type ProtocolGender = "MALE" | "FEMALE";

type GenderSource = {
  genderRaw?: string | null;
  ageGroupRaw?: string | null;
};

type GroupingRow = {
  ageGroupRaw: string | null;
  gender: ProtocolGender | null;
  finishTimeSeconds: number | null;
};

export type ProtocolGroupBucket = {
  groupKey: string;
  label: string;
  gender: ProtocolGender | null;
  finishTimes: number[];
};

export type DisplayProtocolGroup = {
  label: string;
  gender: ProtocolGender | null;
};

export type ProtocolGroupSectionKey =
  | "male"
  | "female"
  | "special"
  | "absolute";

function normalizeForMatching(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/Ё/g, "Е")
    .replace(/\s+/g, " ");
}

function genderFromValue(
  value: string | null | undefined,
): ProtocolGender | null {
  const normalized = normalizeForMatching(value);
  if (!normalized) return null;

  if (
    /^(Ж|F|W)(?:[\s_\-\d]|$)/.test(normalized) ||
    /ЖЕНЩ|ЖЕНСК/.test(normalized) ||
    /(^|[^A-Z])(FEMALE|WOMAN|WOMEN)([^A-Z]|$)/.test(normalized)
  ) {
    return "FEMALE";
  }

  if (
    /^(М|M)(?:[\s_\-\d]|$)/.test(normalized) ||
    /МУЖЧ|МУЖСК/.test(normalized) ||
    /(^|[^A-Z])(MALE|MAN|MEN)([^A-Z]|$)/.test(normalized)
  ) {
    return "MALE";
  }

  return null;
}

export function inferProtocolGender(
  source: GenderSource,
): ProtocolGender | null {
  return genderFromValue(source.genderRaw) ?? genderFromValue(source.ageGroupRaw);
}

export function isAbsoluteProtocolGroup(label: string) {
  return /АБСОЛЮТ|ОБЩАЯ ГРУППА|OPEN|OVERALL/.test(
    normalizeForMatching(label),
  );
}

export function isSpecialProtocolGroup(label: string) {
  return /ЭЛИТ|ПАРААТЛЕТ|ПАРАТРИ|ELITE|PARA|PRO CATEGORY/.test(
    normalizeForMatching(label),
  );
}

function getGroupIdentity(row: GroupingRow) {
  const sourceLabel = row.ageGroupRaw?.trim();

  if (!sourceLabel) {
    if (row.gender === "MALE") {
      return { groupKey: "MALE", label: "Мужчины" };
    }
    if (row.gender === "FEMALE") {
      return { groupKey: "FEMALE", label: "Женщины" };
    }
    return { groupKey: "OPEN", label: "Абсолют" };
  }

  const labelGender = inferProtocolGender({ ageGroupRaw: sourceLabel });
  if (row.gender && !labelGender && !isAbsoluteProtocolGroup(sourceLabel)) {
    const genderLabel = row.gender === "MALE" ? "Мужчины" : "Женщины";
    return {
      groupKey: `${row.gender}:${sourceLabel}`,
      label: `${genderLabel} · ${sourceLabel}`,
    };
  }

  return { groupKey: sourceLabel, label: sourceLabel };
}

export function groupProtocolRows(rows: GroupingRow[]) {
  const grouped = new Map<string, ProtocolGroupBucket>();

  for (const row of rows) {
    const identity = getGroupIdentity(row);
    const group = grouped.get(identity.groupKey) ?? {
      ...identity,
      gender: row.gender,
      finishTimes: [],
    };

    if (!group.gender && row.gender) {
      group.gender = row.gender;
    }
    if (row.finishTimeSeconds !== null) {
      group.finishTimes.push(row.finishTimeSeconds);
    }

    grouped.set(identity.groupKey, group);
  }

  return [...grouped.values()];
}

export function getProtocolGroupSection(group: DisplayProtocolGroup) {
  if (isSpecialProtocolGroup(group.label)) return "special";
  if (isAbsoluteProtocolGroup(group.label)) return "absolute";

  const gender =
    group.gender ?? inferProtocolGender({ ageGroupRaw: group.label });
  if (gender === "MALE") return "male";
  if (gender === "FEMALE") return "female";
  return "absolute";
}

export const PROTOCOL_GROUP_SECTION_LABELS: Record<
  ProtocolGroupSectionKey,
  string
> = {
  male: "Мужчины",
  female: "Женщины",
  special: "Специальные категории",
  absolute: "Абсолют",
};

export function splitProtocolGroupsForDisplay<T extends DisplayProtocolGroup>(
  groups: T[],
) {
  const sections = new Map<ProtocolGroupSectionKey, T[]>();

  for (const group of groups) {
    const key = getProtocolGroupSection(group);
    const section = sections.get(key) ?? [];
    section.push(group);
    sections.set(key, section);
  }

  const order: ProtocolGroupSectionKey[] = [
    "male",
    "female",
    "special",
    "absolute",
  ];

  return order
    .filter((key) => sections.has(key))
    .map((key) => ({
      key,
      label: PROTOCOL_GROUP_SECTION_LABELS[key],
      groups: sections.get(key)!,
    }));
}
