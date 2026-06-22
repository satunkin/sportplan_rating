import { EntityStatus, Gender, Prisma } from "@prisma/client";

import {
  createCompetitionProposal,
  createDirectoryProposal,
  createResultChangeRequest,
  createTelegramResultSubmission,
  getTelegramAthlete,
  getTelegramAthleteDashboard,
  listTelegramCompetitions,
  registerTelegramAthlete,
  updateTelegramAthleteProfile,
} from "@/lib/cyclon-service";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/runtime-config";
import { parseTimeToSeconds } from "@/lib/time";
import {
  answerTelegramCallback,
  sendTelegramMessage,
} from "@/lib/telegram/client";

type TelegramUser = {
  id: number;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number };
  from?: TelegramUser;
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  from: TelegramUser;
  message?: TelegramMessage;
};

export type TelegramUpdatePayload = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type ConversationData = Record<string, string | boolean | null>;

const MAIN_MENU = [
  ["Добавить результат", "Мои результаты"],
  ["Моё место в рейтинге", "Мои данные"],
  ["Помощь"],
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readConversationData(value: Prisma.JsonValue | null): ConversationData {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as ConversationData;
}

async function saveConversation(params: {
  telegramId: string;
  chatId: string;
  state: string;
  userId?: string | null;
  data?: ConversationData;
}) {
  return prisma.telegramConversation.upsert({
    where: { telegramId: params.telegramId },
    update: {
      chatId: params.chatId,
      state: params.state,
      userId: params.userId,
      dataJson: (params.data ?? {}) as Prisma.InputJsonObject,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
    create: {
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: params.state,
      userId: params.userId,
      dataJson: (params.data ?? {}) as Prisma.InputJsonObject,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
}

async function showMainMenu(chatId: string, prefix?: string) {
  await sendTelegramMessage(
    chatId,
    `${prefix ? `${prefix}\n\n` : ""}<b>Кубок Циклон · 2026</b>\nВыберите действие:`,
    { replyKeyboard: MAIN_MENU },
  );
}

async function startOnboarding(
  telegramId: string,
  chatId: string,
  username?: string,
) {
  await saveConversation({
    telegramId,
    chatId,
    state: "ONBOARD_NAME",
    data: { telegramUsername: username ?? null },
  });
  await sendTelegramMessage(
    chatId,
    "Добро пожаловать в <b>Кубок Циклон · 2026</b>.\n\nВведите фамилию и имя, например: <code>Иванов Николай</code>.",
  );
}

async function handleStart(
  telegramId: string,
  chatId: string,
  username?: string,
) {
  const user = await getTelegramAthlete(telegramId);

  if (!user?.athlete) {
    await startOnboarding(telegramId, chatId, username);
    return;
  }

  await saveConversation({
    telegramId,
    chatId,
    userId: user.id,
    state: "MAIN",
  });
  await showMainMenu(
    chatId,
    `Здравствуйте, ${escapeHtml(user.athlete.firstName)}.`,
  );
}

async function showCompetitionPicker(telegramId: string, chatId: string) {
  const competitions = await listTelegramCompetitions();

  await saveConversation({
    telegramId,
    chatId,
    state: "RESULT_COMPETITION",
  });

  const keyboard = competitions.slice(0, 12).map((competition) => [
    {
      text: `${competition.eventDate.toLocaleDateString("ru-RU")} · ${competition.name}`,
      callback_data: `competition:${competition.id}`,
    },
  ]);
  keyboard.push([
    {
      text: "Предложить новое соревнование",
      callback_data: "competition:new",
    },
  ]);

  await sendTelegramMessage(
    chatId,
    competitions.length
      ? "Выберите соревнование:"
      : "В списке пока нет соревнований. Предложите новый старт.",
    { inlineKeyboard: keyboard },
  );
}

async function showAthleteResults(telegramId: string, chatId: string) {
  const dashboard = await getTelegramAthleteDashboard(telegramId);

  if (!dashboard) {
    await sendTelegramMessage(chatId, "Сначала завершите регистрацию: /start");
    return;
  }

  const verified = dashboard.athlete.verifiedResults;
  const pending = dashboard.athlete.submissions;
  const verifiedText = verified.length
    ? verified
        .map(
          (result, index) =>
            `${index < 3 ? "✅" : "▫️"} <b>${escapeHtml(result.submission.eventNameRaw)}</b>\n` +
            `${escapeHtml(result.submission.distanceLabel)} · ${escapeHtml(result.submission.finishTimeRaw)} · ${result.awardedPoints} очков`,
        )
        .join("\n\n")
    : "Подтверждённых результатов пока нет.";
  const pendingText = pending.length
    ? `\n\n<b>Заявки</b>\n${pending
        .map(
          (submission) =>
            `• ${escapeHtml(submission.eventNameRaw)} — ${submission.status}`,
        )
        .join("\n")}`
    : "";

  const keyboard = verified.slice(0, 8).map((result) => [
    {
      text: `Изменить: ${result.submission.eventNameRaw}`,
      callback_data: `result:update:${result.id}`,
    },
    {
      text: "Удалить",
      callback_data: `result:delete:${result.id}`,
    },
  ]);

  await sendTelegramMessage(
    chatId,
    `<b>Мои результаты</b>\n\n${verifiedText}${pendingText}`,
    keyboard.length ? { inlineKeyboard: keyboard } : undefined,
  );
}

async function showRanking(telegramId: string, chatId: string) {
  const dashboard = await getTelegramAthleteDashboard(telegramId);

  if (!dashboard) {
    await sendTelegramMessage(chatId, "Сначала завершите регистрацию: /start");
    return;
  }

  const best = dashboard.athlete.verifiedResults.slice(0, 3);
  const ranking = dashboard.ranking;
  const bestText = best.length
    ? best
        .map(
          (result, index) =>
            `${index + 1}. ${escapeHtml(result.submission.eventNameRaw)} — ${result.awardedPoints}`,
        )
        .join("\n")
    : "Зачётных стартов пока нет.";

  await sendTelegramMessage(
    chatId,
    `<b>${escapeHtml(dashboard.displayName)}</b>\n` +
      `Место: <b>${ranking?.rank ?? "—"}</b>\n` +
      `Очки: <b>${ranking?.totalPoints ?? 0}</b>\n\n` +
      `<b>Три лучших результата</b>\n${bestText}\n\n` +
      `<a href="${getAppBaseUrl()}/leaderboard">Открыть полный рейтинг</a>`,
  );
}

async function showProfile(telegramId: string, chatId: string) {
  const dashboard = await getTelegramAthleteDashboard(telegramId);

  if (!dashboard) {
    await sendTelegramMessage(chatId, "Сначала завершите регистрацию: /start");
    return;
  }

  const athlete = dashboard.athlete;
  const clubs =
    athlete.clubs.map(({ club }) => club.name).join(", ") || "не указаны";
  const coaches =
    athlete.coaches.map(({ coach }) => coach.name).join(", ") || "не указаны";

  await sendTelegramMessage(
    chatId,
    `<b>Мои данные</b>\n\n` +
      `Имя: ${escapeHtml(dashboard.displayName)}\n` +
      `Дата рождения: ${athlete.birthDate.toLocaleDateString("ru-RU")}\n` +
      `Группа: ${escapeHtml(athlete.seasonAgeGroup ?? "не определена")}\n` +
      `Клубы: ${escapeHtml(clubs)}\n` +
      `Тренеры: ${escapeHtml(coaches)}\n` +
      `Telegram публичен: ${athlete.showTelegramProfile ? "да" : "нет"}`,
    {
      inlineKeyboard: [
        [
          { text: "Изменить имя", callback_data: "profile:name" },
          { text: "Дата рождения", callback_data: "profile:birth" },
        ],
        [
          { text: "Добавить клуб", callback_data: "profile:club" },
          { text: "Добавить тренера", callback_data: "profile:coach" },
        ],
        [
          {
            text: athlete.showTelegramProfile
              ? "Скрыть Telegram"
              : "Показывать Telegram",
            callback_data: "profile:telegram",
          },
        ],
      ],
    },
  );
}

async function handleMainText(
  telegramId: string,
  chatId: string,
  text: string,
) {
  if (text === "Добавить результат") {
    await showCompetitionPicker(telegramId, chatId);
    return;
  }
  if (text === "Мои результаты") {
    await showAthleteResults(telegramId, chatId);
    return;
  }
  if (text === "Моё место в рейтинге") {
    await showRanking(telegramId, chatId);
    return;
  }
  if (text === "Мои данные") {
    await showProfile(telegramId, chatId);
    return;
  }
  if (text === "Помощь") {
    await sendTelegramMessage(
      chatId,
      "<b>Как работает рейтинг</b>\n" +
        "Вы отправляете результат, администратор сверяет его с протоколом, после подтверждения очки появляются в рейтинге. В зачёт идут три лучших старта.\n\n" +
        "Команда /cancel отменяет текущий ввод.",
    );
    return;
  }

  await showMainMenu(chatId, "Не понял команду.");
}

async function handleConversationText(params: {
  telegramId: string;
  chatId: string;
  username?: string;
  text: string;
}) {
  const conversation = await prisma.telegramConversation.findUnique({
    where: { telegramId: params.telegramId },
  });
  const state = conversation?.state ?? "MAIN";
  const data = readConversationData(conversation?.dataJson ?? null);

  if (params.text === "/cancel") {
    const user = await getTelegramAthlete(params.telegramId);
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      userId: user?.id,
      state: user?.athlete ? "MAIN" : "ONBOARD_NAME",
    });
    if (user?.athlete) await showMainMenu(params.chatId, "Текущий ввод отменён.");
    else await startOnboarding(params.telegramId, params.chatId, params.username);
    return;
  }

  if (state === "ONBOARD_NAME") {
    if (params.text.trim().split(/\s+/).length < 2) {
      await sendTelegramMessage(
        params.chatId,
        "Введите фамилию и имя двумя словами, например: <code>Иванов Николай</code>.",
      );
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "ONBOARD_BIRTH",
      data: { ...data, fullName: params.text.trim() },
    });
    await sendTelegramMessage(
      params.chatId,
      "Введите дату рождения в формате <code>ДД.ММ.ГГГГ</code>.",
    );
    return;
  }

  if (state === "ONBOARD_BIRTH") {
    const match = params.text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : "";
    const date = iso ? new Date(`${iso}T00:00:00.000Z`) : null;
    if (!date || Number.isNaN(date.getTime())) {
      await sendTelegramMessage(
        params.chatId,
        "Не удалось прочитать дату. Используйте формат <code>ДД.ММ.ГГГГ</code>.",
      );
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "ONBOARD_GENDER",
      data: { ...data, birthDate: iso },
    });
    await sendTelegramMessage(params.chatId, "Выберите зачёт:", {
      inlineKeyboard: [
        [
          { text: "Мужской", callback_data: "onboard:gender:MALE" },
          { text: "Женский", callback_data: "onboard:gender:FEMALE" },
        ],
      ],
    });
    return;
  }

  if (state === "RESULT_TIME") {
    if (parseTimeToSeconds(params.text) === null) {
      await sendTelegramMessage(
        params.chatId,
        "Введите время в формате <code>ММ:СС</code> или <code>ЧЧ:ММ:СС</code>.",
      );
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "RESULT_FIFTH",
      data: { ...data, finishTime: params.text.trim() },
    });
    await sendTelegramMessage(
      params.chatId,
      "Если знаете время пятого места в своей группе — введите его. Иначе отправьте <code>-</code>.",
    );
    return;
  }

  if (state === "RESULT_FIFTH") {
    if (params.text !== "-" && parseTimeToSeconds(params.text) === null) {
      await sendTelegramMessage(
        params.chatId,
        "Введите корректное время или отправьте <code>-</code>.",
      );
      return;
    }
    const nextData: ConversationData = {
      ...data,
      fifthPlaceTime: params.text === "-" ? null : params.text.trim(),
    };
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "RESULT_CONFIRM",
      data: nextData,
    });
    await sendTelegramMessage(
      params.chatId,
      `<b>Проверьте заявку</b>\n` +
        `Соревнование: ${escapeHtml(String(nextData.competitionName ?? ""))}\n` +
        `Дистанция: ${escapeHtml(String(nextData.distanceLabel ?? ""))}\n` +
        `Время: ${escapeHtml(String(nextData.finishTime ?? ""))}\n` +
        `Пятое место: ${escapeHtml(String(nextData.fifthPlaceTime ?? "не указано"))}`,
      {
        inlineKeyboard: [
          [
            { text: "Отправить", callback_data: "result:confirm" },
            { text: "Отмена", callback_data: "result:cancel" },
          ],
        ],
      },
    );
    return;
  }

  if (state === "COMPETITION_PROPOSAL_NAME") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "COMPETITION_PROPOSAL_DATE",
      data: { proposalName: params.text.trim() },
    });
    await sendTelegramMessage(
      params.chatId,
      "Введите дату соревнования в формате <code>ДД.ММ.ГГГГ</code>.",
    );
    return;
  }

  if (state === "COMPETITION_PROPOSAL_DATE") {
    const match = params.text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) {
      await sendTelegramMessage(
        params.chatId,
        "Используйте формат <code>ДД.ММ.ГГГГ</code>.",
      );
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "COMPETITION_PROPOSAL_DISTANCE",
      data: { ...data, proposalDate: `${match[3]}-${match[2]}-${match[1]}` },
    });
    await sendTelegramMessage(params.chatId, "Введите название дистанции.");
    return;
  }

  if (state === "COMPETITION_PROPOSAL_DISTANCE") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "COMPETITION_PROPOSAL_DISCIPLINE",
      data: { ...data, proposalDistance: params.text.trim() },
    });
    await sendTelegramMessage(params.chatId, "Выберите дисциплину:", {
      inlineKeyboard: [
        [
          { text: "Бег", callback_data: "proposal:discipline:RUNNING" },
          { text: "Велоспорт", callback_data: "proposal:discipline:CYCLING" },
        ],
        [
          { text: "Плавание", callback_data: "proposal:discipline:SWIMMING" },
          { text: "Триатлон", callback_data: "proposal:discipline:TRIATHLON" },
        ],
      ],
    });
    return;
  }

  if (state === "PROFILE_NAME") {
    await updateTelegramAthleteProfile({
      telegramId: params.telegramId,
      fullName: params.text,
      telegramUsername: params.username,
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showProfile(params.telegramId, params.chatId);
    return;
  }

  if (state === "PROFILE_BIRTH") {
    const match = params.text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) {
      await sendTelegramMessage(
        params.chatId,
        "Используйте формат <code>ДД.ММ.ГГГГ</code>.",
      );
      return;
    }
    await updateTelegramAthleteProfile({
      telegramId: params.telegramId,
      birthDate: `${match[3]}-${match[2]}-${match[1]}`,
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showProfile(params.telegramId, params.chatId);
    return;
  }

  if (state === "PROFILE_CLUB" || state === "PROFILE_COACH") {
    await createDirectoryProposal({
      telegramId: params.telegramId,
      type: state === "PROFILE_CLUB" ? "club" : "coach",
      name: params.text,
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showMainMenu(
      params.chatId,
      "Название отправлено администратору для проверки.",
    );
    return;
  }

  if (state === "RESULT_UPDATE_TIME") {
    if (parseTimeToSeconds(params.text) === null) {
      await sendTelegramMessage(
        params.chatId,
        "Введите корректное новое время.",
      );
      return;
    }
    await createResultChangeRequest({
      telegramId: params.telegramId,
      verifiedResultId: String(data.verifiedResultId ?? ""),
      type: "update",
      finishTime: params.text,
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showMainMenu(
      params.chatId,
      "Изменение отправлено на повторную модерацию. Старый результат действует до решения администратора.",
    );
    return;
  }

  await handleMainText(params.telegramId, params.chatId, params.text);
}

async function handleCallback(params: {
  telegramId: string;
  chatId: string;
  username?: string;
  callback: TelegramCallbackQuery;
}) {
  const data = params.callback.data ?? "";
  const conversation = await prisma.telegramConversation.findUnique({
    where: { telegramId: params.telegramId },
  });
  const conversationData = readConversationData(
    conversation?.dataJson ?? null,
  );
  await answerTelegramCallback(params.callback.id);

  if (data.startsWith("onboard:gender:")) {
    const gender = data.endsWith("FEMALE") ? Gender.FEMALE : Gender.MALE;
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "ONBOARD_PUBLIC",
      data: { ...conversationData, gender },
    });
    await sendTelegramMessage(
      params.chatId,
      "Разрешить показывать ваш Telegram username в раскрытии рейтинга?",
      {
        inlineKeyboard: [
          [
            { text: "Да", callback_data: "onboard:public:yes" },
            { text: "Нет", callback_data: "onboard:public:no" },
          ],
        ],
      },
    );
    return;
  }

  if (data.startsWith("onboard:public:")) {
    const result = await registerTelegramAthlete({
      telegramId: params.telegramId,
      telegramUsername: params.username,
      chatId: params.chatId,
      fullName: String(conversationData.fullName ?? ""),
      birthDate: String(conversationData.birthDate ?? ""),
      gender:
        conversationData.gender === Gender.FEMALE ? Gender.FEMALE : Gender.MALE,
      showTelegramProfile: data.endsWith(":yes"),
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      userId: result.status === "pending_link" ? null : result.user.id,
      state: result.status === "pending_link" ? "LINK_PENDING" : "MAIN",
    });
    if (result.status === "pending_link") {
      await sendTelegramMessage(
        params.chatId,
        "Мы нашли похожий профиль. Запрос на безопасное связывание отправлен администратору; автоматически объединять данные не будем.",
      );
    } else {
      await showMainMenu(params.chatId, "Регистрация завершена.");
    }
    return;
  }

  if (data.startsWith("competition:")) {
    const competitionId = data.slice("competition:".length);
    if (competitionId === "new") {
      await saveConversation({
        telegramId: params.telegramId,
        chatId: params.chatId,
        state: "COMPETITION_PROPOSAL_NAME",
      });
      await sendTelegramMessage(params.chatId, "Введите название соревнования.");
      return;
    }
    const competition = await prisma.competition.findFirst({
      where: { id: competitionId, status: EntityStatus.ACTIVE },
      include: {
        distances: {
          where: { status: EntityStatus.ACTIVE },
          orderBy: { distanceLabel: "asc" },
        },
      },
    });
    if (!competition) {
      await sendTelegramMessage(params.chatId, "Соревнование больше недоступно.");
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "RESULT_DISTANCE",
      data: {
        competitionId: competition.id,
        competitionName: competition.name,
      },
    });
    await sendTelegramMessage(params.chatId, "Выберите дистанцию:", {
      inlineKeyboard: competition.distances.map((distance) => [
        {
          text: distance.distanceLabel,
          callback_data: `distance:${distance.id}`,
        },
      ]),
    });
    return;
  }

  if (data.startsWith("proposal:discipline:")) {
    await createCompetitionProposal({
      telegramId: params.telegramId,
      name: String(conversationData.proposalName ?? ""),
      date: String(conversationData.proposalDate ?? ""),
      distance: String(conversationData.proposalDistance ?? ""),
      discipline: data.slice("proposal:discipline:".length),
    });
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showMainMenu(
      params.chatId,
      "Предложение отправлено администратору. После подтверждения старт появится в списке.",
    );
    return;
  }

  if (data.startsWith("distance:")) {
    const eventId = data.slice("distance:".length);
    const event = await prisma.event.findFirst({
      where: { id: eventId, status: EntityStatus.ACTIVE },
    });
    if (!event) {
      await sendTelegramMessage(params.chatId, "Дистанция больше недоступна.");
      return;
    }
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "RESULT_TIME",
      data: {
        ...conversationData,
        eventId,
        distanceLabel: event.distanceLabel,
      },
    });
    await sendTelegramMessage(
      params.chatId,
      "Введите своё финишное время в формате <code>ММ:СС</code> или <code>ЧЧ:ММ:СС</code>.",
    );
    return;
  }

  if (data === "result:confirm") {
    try {
      await createTelegramResultSubmission({
        telegramId: params.telegramId,
        eventId: String(conversationData.eventId ?? ""),
        finishTime: String(conversationData.finishTime ?? ""),
        fifthPlaceTime: conversationData.fifthPlaceTime
          ? String(conversationData.fifthPlaceTime)
          : null,
      });
      await saveConversation({
        telegramId: params.telegramId,
        chatId: params.chatId,
        state: "MAIN",
      });
      await showMainMenu(
        params.chatId,
        "Заявка принята. Она появится в рейтинге после проверки администратором.",
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message === "DUPLICATE_SUBMISSION"
          ? "Такая заявка уже существует."
          : "Не удалось сохранить заявку. Попробуйте ещё раз или напишите администратору.";
      await sendTelegramMessage(params.chatId, message);
    }
    return;
  }

  if (data === "result:cancel") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "MAIN",
    });
    await showMainMenu(params.chatId, "Заявка отменена.");
    return;
  }

  if (data.startsWith("result:update:")) {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "RESULT_UPDATE_TIME",
      data: { verifiedResultId: data.slice("result:update:".length) },
    });
    await sendTelegramMessage(params.chatId, "Введите исправленное время.");
    return;
  }

  if (data.startsWith("result:delete:")) {
    await createResultChangeRequest({
      telegramId: params.telegramId,
      verifiedResultId: data.slice("result:delete:".length),
      type: "delete",
    });
    await showMainMenu(
      params.chatId,
      "Запрос на удаление отправлен. Результат действует до решения администратора.",
    );
    return;
  }

  if (data === "profile:name") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "PROFILE_NAME",
    });
    await sendTelegramMessage(params.chatId, "Введите новую фамилию и имя.");
    return;
  }

  if (data === "profile:birth") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: "PROFILE_BIRTH",
    });
    await sendTelegramMessage(
      params.chatId,
      "Введите дату рождения в формате <code>ДД.ММ.ГГГГ</code>.",
    );
    return;
  }

  if (data === "profile:club" || data === "profile:coach") {
    await saveConversation({
      telegramId: params.telegramId,
      chatId: params.chatId,
      state: data === "profile:club" ? "PROFILE_CLUB" : "PROFILE_COACH",
    });
    await sendTelegramMessage(
      params.chatId,
      data === "profile:club"
        ? "Введите название клуба."
        : "Введите имя тренера.",
    );
    return;
  }

  if (data === "profile:telegram") {
    const user = await getTelegramAthlete(params.telegramId);
    if (user?.athlete) {
      await updateTelegramAthleteProfile({
        telegramId: params.telegramId,
        showTelegramProfile: !user.athlete.showTelegramProfile,
        telegramUsername: params.username,
      });
      await showProfile(params.telegramId, params.chatId);
    }
  }
}

export async function handleTelegramUpdate(update: TelegramUpdatePayload) {
  const updateId = String(update.update_id);
  const existing = await prisma.telegramUpdate.findUnique({
    where: { updateId },
  });
  if (existing?.handledAt) return;

  if (!existing) {
    await prisma.telegramUpdate.create({ data: { updateId } });
  }

  const callback = update.callback_query;
  const message = update.message ?? callback?.message;
  const from = update.message?.from ?? callback?.from;

  if (!message || !from) {
    await prisma.telegramUpdate.update({
      where: { updateId },
      data: { handledAt: new Date() },
    });
    return;
  }

  const telegramId = String(from.id);
  const chatId = String(message.chat.id);

  if (callback) {
    await handleCallback({
      telegramId,
      chatId,
      username: from.username,
      callback,
    });
  } else {
    const text = message.text?.trim();
    if (!text) return;
    if (text === "/start") {
      await handleStart(telegramId, chatId, from.username);
    } else {
      await handleConversationText({
        telegramId,
        chatId,
        username: from.username,
        text,
      });
    }
  }

  await prisma.telegramUpdate.update({
    where: { updateId },
    data: { handledAt: new Date() },
  });
}
