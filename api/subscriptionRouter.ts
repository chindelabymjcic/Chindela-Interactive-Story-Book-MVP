import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findSubscriptionsByParent,
  findActiveSubscription,
  createSubscription,
  findSubscriptionById,
  cancelSubscription,
  createPayment,
  findPaymentsByParent,
} from "./queries/subscriptions";

export const subscriptionRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return findSubscriptionsByParent(ctx.user.id);
  }),

  active: authedQuery
    .input(z.object({ childId: z.number(), ageGroupId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verify child belongs to parent
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return findActiveSubscription(input.childId, input.ageGroupId);
    }),

  create: authedQuery
    .input(
      z.object({
        childId: z.number(),
        ageGroupId: z.number(),
        duration: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const pricePerMonth = 1.0; // £1 per month
      const totalPrice = pricePerMonth * input.duration;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + input.duration);

      const subscription = await createSubscription({
        parentId: ctx.user.id,
        childId: input.childId,
        ageGroupId: input.ageGroupId,
        duration: input.duration,
        pricePerMonth: pricePerMonth.toString(),
        totalPrice: totalPrice.toString(),
        currency: "GBP",
        status: "pending",
        startDate,
        endDate,
      });

      // Create payment record
      const paymentId = await createPayment({
        subscriptionId: subscription!.id,
        parentId: ctx.user.id,
        amount: totalPrice.toString(),
        currency: "GBP",
        status: "pending",
      });

      return { subscription, paymentId };
    }),


  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const sub = await findSubscriptionById(input.id);
      if (!sub || sub.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return cancelSubscription(input.id);
    }),

  payments: authedQuery.query(async ({ ctx }) => {
    return findPaymentsByParent(ctx.user.id);
  }),
});
