import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const appBaseUrl = process.env.APP_BASE_URL?.trim()?.replace(/\/$/, "");

if (!token || !secret || !appBaseUrl || appBaseUrl.includes("localhost")) {
  throw new Error(
    "Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET and a public APP_BASE_URL before registering the webhook.",
  );
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: `${appBaseUrl}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
});

const payload = await response.json();

if (!response.ok || payload.ok !== true) {
  throw new Error(`Telegram setWebhook failed: ${JSON.stringify(payload)}`);
}

console.log(`Telegram webhook registered at ${appBaseUrl}/api/telegram/webhook`);
