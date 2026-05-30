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
  placementOverall: string;
  placementInAgeGroup: string;
  comment: string;
};

export type ResultSubmission = ResultSubmissionInput & {
  id: string;
  status: "pending_manual_review";
  createdAt: string;
};

export type ResultSubmissionValidation =
  | { success: true; data: ResultSubmissionInput }
  | { success: false; errors: string[]; fieldErrors: Partial<Record<keyof ResultSubmissionInput, string>> };

export type ResultSubmissionFieldErrors = Partial<
  Record<keyof ResultSubmissionInput, string>
>;

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

function isValidPlacement(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

function normalizeSeasonDate(value: string) {
  const normalized = value.trim();
  let day: number;
  let month: number;
  let year: number;

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    [, year, month, day] = isoMatch.map(Number);
  } else {
    const fullDateMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

    if (fullDateMatch) {
      [, day, month, year] = fullDateMatch.map(Number);
    } else {
      const shortDateMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})$/);

      if (!shortDateMatch) {
        return null;
      }

      [, day, month] = shortDateMatch.map(Number);
      year = new Date().getFullYear();
    }
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${isoDate}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return isoDate;
}

export function validateResultSubmission(
  input: ResultSubmissionInput,
): ResultSubmissionValidation {
  const errors: string[] = [];
  const fieldErrors: ResultSubmissionFieldErrors = {};

  const eventName = normalizeSpace(input.eventName);
  const eventDate = normalizeSeasonDate(input.eventDate);
  const distanceLabel = normalizeSpace(input.distanceLabel);
  const ageGroupClaimed = normalizeSpace(input.ageGroupClaimed);
  const finishTime = input.finishTime.trim();
  const protocolUrl = input.protocolUrl.trim();
  const placementOverall = input.placementOverall.trim();
  const placementInAgeGroup = input.placementInAgeGroup.trim();
  const comment = normalizeSpace(input.comment);

  if (!eventName) {
    const message = "Укажите название соревнования.";
    errors.push(message);
    fieldErrors.eventName = message;
  }

  if (!eventDate) {
    const message = "Укажите корректную дату старта с годом.";
    errors.push(message);
    fieldErrors.eventDate = message;
  }

  if (!DISCIPLINE_OPTIONS.some((option) => option.value === input.discipline)) {
    const message = "Выберите дисциплину.";
    errors.push(message);
    fieldErrors.discipline = message;
  }

  if (!distanceLabel) {
    const message = "Укажите дистанцию.";
    errors.push(message);
    fieldErrors.distanceLabel = message;
  }

  if (!ageGroupClaimed) {
    const message = "Укажите возрастную группу из протокола.";
    errors.push(message);
    fieldErrors.ageGroupClaimed = message;
  }

  if (!isValidTime(finishTime)) {
    const message = "Время результата должно быть в формате мм:сс или чч:мм:сс.";
    errors.push(message);
    fieldErrors.finishTime = message;
  }

  if (protocolUrl && !isValidUrl(protocolUrl)) {
    const message = "Если ссылка на протокол указана, она должна быть корректной.";
    errors.push(message);
    fieldErrors.protocolUrl = message;
  }

  if (placementOverall && !isValidPlacement(placementOverall)) {
    const message = "Место в абсолюте должно быть положительным числом.";
    errors.push(message);
    fieldErrors.placementOverall = message;
  }

  if (placementInAgeGroup && !isValidPlacement(placementInAgeGroup)) {
    const message = "Место в возрастной группе должно быть положительным числом.";
    errors.push(message);
    fieldErrors.placementInAgeGroup = message;
  }

  if (errors.length > 0) {
    return { success: false, errors, fieldErrors };
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
      placementOverall,
      placementInAgeGroup,
      comment,
    },
  };
}
