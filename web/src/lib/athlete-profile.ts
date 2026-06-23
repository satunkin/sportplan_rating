export type AthleteGender = "male" | "female";

export type AthleteProfileInput = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  city: string;
  birthDate: string;
  gender: AthleteGender;
};

export type AthleteProfile = AthleteProfileInput & {
  seasonYear: number;
  seasonAge: number;
  seasonAgeGroup: string;
  publicDisplayName: string;
  showPublicResults: boolean;
};

export type AdminAthleteProfileInput = {
  firstName: string;
  lastName: string;
  city: string;
  birthDate: string;
  gender: AthleteGender;
  telegramUsername: string;
};

export type AdminAthleteProfile = {
  firstName: string;
  lastName: string;
  city: string;
  birthDate: string;
  gender: AthleteGender;
  seasonYear: number;
  seasonAge: number;
  seasonAgeGroup: string;
  publicDisplayName: string;
  showPublicResults: boolean;
  telegramUsername: string;
};

export type ValidationResult =
  | { success: true; data: AthleteProfile }
  | { success: false; errors: string[] };

const NAME_REGEX = /^[A-Za-zА-Яа-яЁё -]+$/;

function normalizeSpace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeTelegramUsername(value: string) {
  const normalized = value.trim().replace(/\s+/g, "");
  if (!normalized) {
    return "";
  }

  return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function getAgeAtSeasonEnd(birthDate: Date, seasonYear: number) {
  const seasonEnd = new Date(Date.UTC(seasonYear, 11, 31));
  let age = seasonEnd.getUTCFullYear() - birthDate.getUTCFullYear();

  const hadBirthday =
    seasonEnd.getUTCMonth() > birthDate.getUTCMonth() ||
    (seasonEnd.getUTCMonth() === birthDate.getUTCMonth() &&
      seasonEnd.getUTCDate() >= birthDate.getUTCDate());

  if (!hadBirthday) {
    age -= 1;
  }

  return age;
}

function getSeasonAgeGroup(gender: AthleteGender, age: number) {
  const prefix = gender === "male" ? "M" : "W";

  if (age < 18) return `${prefix}U18`;
  if (age <= 24) return `${prefix}18-24`;
  if (age >= 70) return `${prefix}70+`;

  const bandStart = Math.floor((age - 25) / 5) * 5 + 25;
  const bandEnd = bandStart + 4;

  return `${prefix}${bandStart}-${bandEnd}`;
}

function validateAthleteProfileBase(
  input: {
    firstName: string;
    lastName: string;
    city: string;
    birthDate: string;
    gender: AthleteGender;
  },
  seasonYear: number,
) {
  const errors: string[] = [];

  const firstName = normalizeSpace(input.firstName);
  const lastName = normalizeSpace(input.lastName);
  const city = normalizeSpace(input.city);
  const birthDateValue = input.birthDate.trim();
  const gender = input.gender;

  if (!firstName || !NAME_REGEX.test(firstName)) {
    errors.push("Укажите корректное имя.");
  }

  if (!lastName || !NAME_REGEX.test(lastName)) {
    errors.push("Укажите корректную фамилию.");
  }

  if (!city) {
    errors.push("Укажите город.");
  }

  const birthDate = new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime())) {
    errors.push("Укажите корректную дату рождения.");
  }

  if (gender !== "male" && gender !== "female") {
    errors.push("Выберите пол.");
  }

  if (errors.length > 0) {
    return { success: false as const, errors };
  }

  const seasonAge = getAgeAtSeasonEnd(birthDate, seasonYear);

  if (seasonAge < 10 || seasonAge > 100) {
    return {
      success: false as const,
      errors: ["Возраст должен быть в разумных пределах для участия в рейтинге."],
    };
  }

  return {
    success: true as const,
    data: {
      firstName,
      lastName,
      city,
      birthDate: birthDateValue,
      gender,
      seasonYear,
      seasonAge,
      seasonAgeGroup: getSeasonAgeGroup(gender, seasonAge),
      publicDisplayName: `${firstName} ${lastName}`.trim(),
      showPublicResults: false,
    },
  };
}

export function validateAthleteProfile(
  input: AthleteProfileInput,
  seasonYear = new Date().getFullYear(),
): ValidationResult {
  const middleName = normalizeSpace(input.middleName);
  const email = input.email.trim().toLowerCase();
  const baseValidation = validateAthleteProfileBase(input, seasonYear);

  if (middleName && !NAME_REGEX.test(middleName)) {
    return {
      success: false,
      errors: ["Отчество содержит недопустимые символы."],
    };
  }

  if (!isValidEmail(email)) {
    return {
      success: false,
      errors: ["Укажите корректный email."],
    };
  }

  if (!baseValidation.success) {
    return baseValidation;
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      middleName,
      email,
    },
  };
}

export function validateAdminAthleteProfile(
  input: AdminAthleteProfileInput,
  seasonYear = new Date().getFullYear(),
):
  | { success: true; data: AdminAthleteProfile }
  | { success: false; errors: string[] } {
  const baseValidation = validateAthleteProfileBase(input, seasonYear);

  if (!baseValidation.success) {
    return baseValidation;
  }

  return {
    success: true,
    data: {
      ...baseValidation.data,
      telegramUsername: normalizeTelegramUsername(input.telegramUsername),
    },
  };
}
