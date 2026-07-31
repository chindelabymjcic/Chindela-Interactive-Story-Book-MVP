import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { count, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { findAllContributions, contributionTotals } from "./queries/contributions";
import { findSubscriptionById, updateSubscription, createPayment } from "./queries/subscriptions";
import { createNotification } from "./queries/notifications";
import { findUserById } from "./queries/users";
import { sendEmail } from "./lib/email";
import { subscriptionConfirmationEmail, paymentReceiptEmail } from "./lib/emailTemplates";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();

    const [usersCount] = await db
      .select({ count: count() })
      .from(schema.users);
    
    const [childrenCount] = await db
      .select({ count: count() })
      .from(schema.children);
    
    const [storiesCount] = await db
      .select({ count: count() })
      .from(schema.stories);
    
    const [lessonsCount] = await db
      .select({ count: count() })
      .from(schema.lessons);
    
    const [diaryCount] = await db
      .select({ count: count() })
      .from(schema.diaryEntries);
    
    const [subscriptionsCount] = await db
      .select({ count: count() })
      .from(schema.subscriptions);
    
    const [activeSubsCount] = await db
      .select({ count: count() })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.status, "active"));

    const [notificationsCount] = await db
      .select({ count: count() })
      .from(schema.notifications);

    return {
      users: usersCount.count,
      children: childrenCount.count,
      stories: storiesCount.count,
      lessons: lessonsCount.count,
      diaryEntries: diaryCount.count,
      subscriptions: subscriptionsCount.count,
      activeSubscriptions: activeSubsCount.count,
      notifications: notificationsCount.count,
    };
  }),

  recentActivity: adminQuery.query(async () => {
    const db = getDb();

    const recentDiary = await db.query.diaryEntries.findMany({
      orderBy: (de, { desc }) => [desc(de.createdAt)],
      limit: 10,
      with: {
        child: true,
      },
    });

    const recentSubs = await db.query.subscriptions.findMany({
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      limit: 10,
      with: {
        parent: true,
        child: true,
        ageGroup: true,
      },
    });

    return {
      recentDiaryEntries: recentDiary,
      recentSubscriptions: recentSubs,
    };
  }),

  allChildren: adminQuery.query(async () => {
    const db = getDb();
    return db.query.children.findMany({
      orderBy: (c, { desc }) => [desc(c.createdAt)],
      with: {
        parent: true,
        ageGroup: true,
      },
    });
  }),

  allSubscriptions: adminQuery.query(async () => {
    const db = getDb();
    return db.query.subscriptions.findMany({
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      with: {
        parent: true,
        child: true,
        ageGroup: true,
        payments: true,
      },
    });
  }),

  allContributions: adminQuery.query(async () => {
    return findAllContributions();
  }),

  contributionStats: adminQuery.query(async () => {
    return contributionTotals();
  }),

  // MVP escape hatch: lets an admin manually activate a subscription after
  // confirming the payment themselves in the Stripe dashboard, without
  // needing the webhook configured. This intentionally bypasses the "only
  // the Stripe webhook may activate a subscription" rule enforced elsewhere
  // (see subscriptionRouter.ts / webhooks/stripe.ts) -- admin-only, and the
  // resulting payment row is tagged "manual_admin_approval" so it's always
  // distinguishable from a real Stripe-confirmed payment in the records.
  approveSubscription: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const sub = await findSubscriptionById(input.id);
      if (!sub) throw new Error("Subscription not found.");
      if (sub.status !== "pending") throw new Error(`This subscription is already "${sub.status}", not pending.`);

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + sub.duration);

      await updateSubscription(sub.id, { status: "active", startDate, endDate });
      await createPayment({
        subscriptionId: sub.id,
        parentId: sub.parentId,
        amount: sub.totalPrice,
        currency: sub.currency,
        status: "completed",
        paymentMethod: "manual_admin_approval",
        paidAt: startDate,
      });
      await createNotification({
        userId: sub.parentId,
        childId: sub.childId,
        type: "payment_succeeded",
        title: "Subscription activated",
        message: "Your payment was confirmed and the subscription is now active.",
        relatedId: sub.id,
      });

      const parent = await findUserById(sub.parentId);
      if (parent) {
        try {
          await sendEmail({
            to: parent.email,
            ...subscriptionConfirmationEmail({
              name: parent.name ?? parent.email,
              childName: sub.child?.name ?? "your child",
              ageGroupName: sub.ageGroup?.name ?? "",
              duration: sub.duration,
              totalPrice: sub.totalPrice,
            }),
          });
          await sendEmail({
            to: parent.email,
            ...paymentReceiptEmail({
              name: parent.name ?? parent.email,
              amount: sub.totalPrice,
              date: startDate.toLocaleDateString("en-GB"),
              description: `Subscription — ${sub.ageGroup?.name ?? ""} (${sub.duration} month(s))`,
            }),
          });
        } catch (err) {
          console.error("[admin] confirmation email failed for manually approved subscription", sub.id, err);
        }
      }

      return findSubscriptionById(sub.id);
    }),
});
