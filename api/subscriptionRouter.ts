import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findSubscriptionsByParent,
  findActiveSubscription,
  createSubscription,
  findSubscriptionById,
  cancelSubscription,
  findPaymentsByParent,
} from "./queries/subscriptions";
import { setStripeCustomerId } from "./queries/users";
import { getStripe, MONTHLY_PRICE_GBP_PENCE, computeCancelAt } from "./lib/stripe";
import { env } from "./lib/env";

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
        isAutoRenew: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      const { findAgeGroupById } = await import("./queries/ageGroups");
      const ageGroup = await findAgeGroupById(input.ageGroupId);
      if (!ageGroup) throw new Error("Age group not found.");

      const pricePerMonth = MONTHLY_PRICE_GBP_PENCE / 100;
      const totalPrice = pricePerMonth * input.duration;

      let stripeCustomerId = ctx.user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await getStripe().customers.create({
          email: ctx.user.email,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        stripeCustomerId = customer.id;
        await setStripeCustomerId(ctx.user.id, stripeCustomerId);
      }

      // No startDate/endDate/payment row here -- those are only ever set by the
      // Stripe webhook once a real payment actually happens. The frontend /
      // checkout-return URL is never trusted for payment status.
      const subscription = await createSubscription({
        parentId: ctx.user.id,
        childId: input.childId,
        ageGroupId: input.ageGroupId,
        duration: input.duration,
        pricePerMonth: pricePerMonth.toString(),
        totalPrice: totalPrice.toString(),
        currency: "GBP",
        status: "pending",
        isAutoRenew: input.isAutoRenew,
      });

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              unit_amount: MONTHLY_PRICE_GBP_PENCE,
              recurring: { interval: "month" },
              product_data: { name: `Chindela Storybook — ${ageGroup.name}` },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: { localSubscriptionId: String(subscription!.id) },
          ...(input.isAutoRenew ? {} : { cancel_at: computeCancelAt(input.duration) }),
        },
        metadata: { localSubscriptionId: String(subscription!.id) },
        success_url: `${env.appUrl}/subscriptions?checkout=success`,
        cancel_url: `${env.appUrl}/subscriptions?checkout=cancel`,
      });

      return { checkoutUrl: session.url, subscriptionId: subscription!.id };
    }),

  cancel: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const sub = await findSubscriptionById(input.id);
      if (!sub || sub.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      if (sub.stripeSubscriptionId) {
        // The webhook (customer.subscription.updated/deleted) is the sole
        // source of truth for local status -- we don't flip it here.
        await getStripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
        return findSubscriptionById(input.id);
      }
      // Never reached Stripe (still "pending", checkout abandoned) -- nothing
      // to cancel remotely, safe to cancel locally directly.
      return cancelSubscription(input.id);
    }),

  payments: authedQuery.query(async ({ ctx }) => {
    return findPaymentsByParent(ctx.user.id);
  }),
});
