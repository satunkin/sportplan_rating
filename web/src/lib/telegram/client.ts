import { getTelegramBotToken } from "@/lib/runtime-config";

type TelegramKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

type SendMessageOptions = {
  inlineKeyboard?: TelegramKeyboardButton[][];
  replyKeyboard?: string[][];
};

async function callTelegramApi<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T | null> {
  const token = getTelegramBotToken();

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[telegram preview] ${method}`, body);
      return null;
    }

    throw new Error("TELEGRAM_BOT_TOKEN_MISSING");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TELEGRAM_API_ERROR:${response.status}:${errorText}`);
  }

  const payload = (await response.json()) as { ok: boolean; result?: T };
  return payload.result ?? null;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: SendMessageOptions = {},
) {
  const replyMarkup = options.inlineKeyboard
    ? { inline_keyboard: options.inlineKeyboard }
    : options.replyKeyboard
      ? {
          keyboard: options.replyKeyboard.map((row) =>
            row.map((label) => ({ text: label })),
          ),
          resize_keyboard: true,
          is_persistent: true,
        }
      : undefined;

  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text?: string,
) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}
