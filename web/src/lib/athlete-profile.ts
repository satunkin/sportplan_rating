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

export function validateAthleteProfile(
  input: AthleteProfileInput,
  seasonYear = new Date().getFullYear(),
): ValidationResult {
  const errors: string[] = [];

  const firstName = normalizeSpace(input.firstName);
  const lastName = normalizeSpace(input.lastName);
  const middleName = normalizeSpace(input.middleName);
  const email = input.email.trim().toLowerCase();
  const city = normalizeSpace(input.city);
  const birthDateValue = input.birthDate.trim();
  const gender = input.gender;

  if (!firstName || !NAME_REGEX.test(firstName)) {
    errors.push("Укажите корректное имя.");
  }

  if (!lastName || !NAME_REGEX.test(lastName)) {
    errors.push("Укажите корректную фамилию.");
  }

  if (middleName && !NAME_REGEX.test(middleName)) {
    errors.push("Отчество содержит недопустимые символы.");
  }

  if (!isValidEmail(email)) {
    errors.push("Укажите корректный email.");
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
    return { success: false, errors };
  }

  const seasonAge = getAgeAtSeasonEnd(birthDate, seasonYear);

  if (seasonAge < 10 || seasonAge > 100) {
    return {
      success: false,
      errors: ["Возраст должен быть в разумных пределах для участия в рейтинге."],
    };
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      middleName,
      email,
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
