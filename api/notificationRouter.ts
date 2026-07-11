import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  findNotificationsByUser,
  findUnreadNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./queries/notifications";

export const notificationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return findNotificationsByUser(ctx.user.id);
  }),

  unread: authedQuery.query(async ({ ctx }) => {
    return findUnreadNotifications(ctx.user.id);
  }),

  unreadCount: authedQuery.query(async ({ ctx }) => {
    const unread = await findUnreadNotifications(ctx.user.id);
    return unread.length;
  }),

  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await markNotificationAsRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  create: adminQuery
    .input(
      z.object({
        userId: z.number(),
        childId: z.number().optional(),
        type: z.enum([
          "diary_entry",
          "ai_feedback",
          "subscription_expiry",
          "safety_alert",
          "milestone",
          "system",
        ]),
        title: z.string().min(1),
        message: z.string().min(1),
        relatedId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createNotification(input);
    }),
});
