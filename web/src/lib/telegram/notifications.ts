import { TelegramDeliveryStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram/client";

export async function notifyAthleteById(athleteId: string, text: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: true,
    },
  });

  if (!athlete?.user.telegramId) return null;

  const conversation = await prisma.telegramConversation.findUnique({
    where: { telegramId: athlete.user.telegramId },
  });

  if (!conversation) return null;

  const notification = await prisma.telegramNotification.create({
    data: {
      telegramId: athlete.user.telegramId,
      chatId: conversation.chatId,
      text,
    },
  });

  try {
    await sendTelegramMessage(conversation.chatId, text);
    return prisma.telegramNotification.update({
      where: { id: notification.id },
      data: {
        status: TelegramDeliveryStatus.SENT,
        attempts: { increment: 1 },
        sentAt: new Date(),
      },
    });
  } catch (error) {
    return prisma.telegramNotification.update({
      where: { id: notification.id },
      data: {
        status: TelegramDeliveryStatus.FAILED,
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message.slice(0, 1000) : "Unknown error",
      },
    });
  }
}
