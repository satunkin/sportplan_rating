export const DISCIPLINE_OPTIONS = [
  { value: "RUNNING", label: "Бег" },
  { value: "CYCLING", label: "Велоспорт" },
  { value: "SWIMMING", label: "Плавание на открытой воде" },
  { value: "TRIATHLON", label: "Триатлон" },
] as const;

export type DisciplineValue = (typeof DISCIPLINE_OPTIONS)[number]["value"];

export type ResultSubmissionInput = {
  eventName: string;
  eventDate: string;
  discipline: DisciplineValue;
  distanceLabel: string;
  ageGroupClaimed: string;
  finishTime: string;
  protocolUrl: string;
  comment: string;
};

export type ResultSubmission = ResultSubmissionInput & {
  id: string;
  status: "pending_manual_review";
  createdAt: string;
};

export type ResultSubmissionValidation =
  | { success: true; data: ResultSubmissionInput }
  | { success: false; errors: string[] };

function normalizeSpace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidTime(value: string) {
  return /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(value);
}

function normalizeSeasonDate(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2})\.(\d{1,2})$/);

  if (!match) {
    return null;
  }

  const [, dayRaw, monthRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  const seasonYear = new Date().getFullYear();
  const isoDate = `${seasonYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return isoDate;
}

export function validateResultSubmission(
  input: ResultSubmissionInput,
): ResultSubmissionValidation {
  const errors: string[] = [];

  const eventName = normalizeSpace(input.eventName);
  const eventDate = normalizeSeasonDate(input.eventDate);
  const distanceLabel = normalizeSpace(input.distanceLabel);
  const ageGroupClaimed = normalizeSpace(input.ageGroupClaimed);
  const finishTime = input.finishTime.trim();
  const protocolUrl = input.protocolUrl.trim();
  const comment = normalizeSpace(input.comment);

  if (!eventName) {
    errors.push("Укажите название соревнования.");
  }

  if (!eventDate) {
    errors.push("Укажите корректную дату старта в формате дд.мм.");
  }

  if (!DISCIPLINE_OPTIONS.some((option) => option.value === input.discipline)) {
    errors.push("Выберите дисциплину.");
  }

  if (!distanceLabel) {
    errors.push("Укажите дистанцию.");
  }

  if (!ageGroupClaimed) {
    errors.push("Укажите возрастную группу из протокола.");
  }

  if (!isValidTime(finishTime)) {
    errors.push("Время результата должно быть в формате мм:сс или чч:мм:сс.");
  }

  if (!isValidUrl(protocolUrl)) {
    errors.push("Укажите корректную ссылку на официальный протокол.");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      eventName,
      eventDate: eventDate!,
      discipline: input.discipline,
      distanceLabel,
      ageGroupClaimed,
      finishTime,
      protocolUrl,
      comment,
    },
  };
}
