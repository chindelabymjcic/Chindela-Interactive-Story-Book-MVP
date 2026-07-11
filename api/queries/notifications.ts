import { eq, desc, and } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertNotification } from "@db/schema";
import { getDb } from "./connection";

export async function findNotificationsByUser(userId: number) {
  return getDb().query.notifications.findMany({
    where: eq(schema.notifications.userId, userId),
    orderBy: [desc(schema.notifications.createdAt)],
    with: {
      child: true,
    },
  });
}

export async function findUnreadNotifications(userId: number) {
  return getDb().query.notifications.findMany({
    where: and(
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.isRead, false)
    ),
    orderBy: [desc(schema.notifications.createdAt)],
  });
}

export async function createNotification(data: InsertNotification) {
  const [result] = await getDb()
    .insert(schema.notifications)
    .values(data)
    .$returningId();
  return result.id;
}

export async function markNotificationAsRead(id: number, userId: number) {
  await getDb()
    .update(schema.notifications)
    .set({ isRead: true })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  await getDb()
    .update(schema.notifications)
    .set({ isRead: true })
    .where(eq(schema.notifications.userId, userId));
}
