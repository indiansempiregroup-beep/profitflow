import type { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

export type NotificationType = 'Scanner' | 'Exchange' | 'Security' | 'PaperTrade';

export async function createNotification(
  prisma: PrismaClient,
  input: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  },
) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: (input.data ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function notifyAllUsers(
  prisma: PrismaClient,
  input: {
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  },
) {
  const users = await prisma.user.findMany({ select: { id: true } });
  await Promise.all(
    users.map((user) =>
      createNotification(prisma, {
        userId: user.id,
        title: input.title,
        body: input.body,
        type: input.type,
        data: input.data,
      }),
    ),
  );
}
