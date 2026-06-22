import { NextRequest, NextResponse } from "next/server";

import { getTelegramWebhookSecret } from "@/lib/runtime-config";
import {
  handleTelegramUpdate,
  type TelegramUpdatePayload,
} from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const expectedSecret = getTelegramWebhookSecret();
  const providedSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdatePayload;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
