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
import { createContribution, findContributionsByParent, updateContributionStatus } from "./queries/contributions";
import { setStripeCustomerId } from "./queries/users";
import type Stripe from "stripe";
import { getStripe, checkoutError, isMissingCustomerError, checkoutReturnBase } from "./lib/stripe";
import { SubscriptionPricingGBPPence, ContributionLimits } from "@contracts/constants";

// The local rows are created before the Checkout Session; if Stripe never
// gives us a session, nothing can ever complete them, so close them out
// rather than leaving a phantom "pending" subscription in the parent's list.
async function discardPendingCheckout(subscriptionId: number, contributionId?: number) {
  try {
    await cancelSubscription(subscriptionId);
    if (contributionId) await updateContributionStatus(contributionId, "failed");
  } catch (err) {
    console.error("[stripe] failed to discard pending checkout rows", { subscriptionId, contributionId, err });
  }
}

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
        duration: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(6), z.literal(12)]),
        isAutoRenew: z.boolean().default(false),
        // Optional one-time donation collected alongside this checkout, in GBP pence.
        contributionGBPPence: z
          .number()
          .int()
          .min(ContributionLimits.minGBPPence)
          .max(ContributionLimits.maxGBPPence)
          .optional(),
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

      // One payment always buys the full chosen duration (e.g. 3 months = £6).
      // With auto-renew ON the same amount recurs every `duration` months;
      // with it OFF it's a single one-time charge and access simply ends.
      const totalGBPPence = SubscriptionPricingGBPPence[input.duration];
      const pricePerMonth = totalGBPPence / input.duration / 100;
      const totalPrice = totalGBPPence / 100;

      const createCustomer = async () => {
        const customer = await getStripe().customers.create({
          email: ctx.user.email,
          name: ctx.user.name ?? undefined,
          metadata: { userId: String(ctx.user.id) },
        });
        await setStripeCustomerId(ctx.user.id, customer.id);
        return customer.id;
      };

      let stripeCustomerId: string;
      try {
        stripeCustomerId = ctx.user.stripeCustomerId ?? (await createCustomer());
      } catch (err) {
        throw checkoutError("customer creation", err);
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

      // The contribution row is created up front (status "pending"), same as the
      // subscription -- the webhook is the only thing allowed to mark it completed.
      let contributionId: number | undefined;
      if (input.contributionGBPPence) {
        contributionId = await createContribution({
          parentId: ctx.user.id,
          subscriptionId: subscription!.id,
          amount: (input.contributionGBPPence / 100).toString(),
          currency: "GBP",
          status: "pending",
        });
      }

      const durationLabel = `${input.duration} month${input.duration === 1 ? "" : "s"}`;
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: "gbp",
            unit_amount: totalGBPPence,
            ...(input.isAutoRenew ? { recurring: { interval: "month" as const, interval_count: input.duration } } : {}),
            product_data: {
              name: `Chindela Storybook — ${ageGroup.name} (${durationLabel})`,
              description: input.isAutoRenew
                ? `For ${child.name}. Renews every ${durationLabel} until cancelled.`
                : `For ${child.name}. ${durationLabel} of access, no automatic renewal.`,
            },
          },
          quantity: 1,
        },
      ];
      // The contribution is a plain one-time line item in both modes: in
      // subscription mode Stripe bills one-time prices on the first invoice
      // only, so it never recurs with renewals.
      if (input.contributionGBPPence) {
        lineItems.push({
          price_data: {
            currency: "gbp",
            unit_amount: input.contributionGBPPence,
            product_data: { name: "Optional contribution — thank you!" },
          },
          quantity: 1,
        });
      }

      const metadata: Record<string, string> = {
        kind: "child_subscription",
        localSubscriptionId: String(subscription!.id),
        autoRenew: String(input.isAutoRenew),
        durationMonths: String(input.duration),
      };
      if (contributionId) metadata.localContributionId = String(contributionId);

      // Auto-renew OFF used to send subscription_data.cancel_at, which is not
      // a Checkout Session parameter -- Stripe rejected every such request, so
      // non-renewing purchases never reached checkout. A non-renewing term is
      // now a plain one-time payment (mode "payment"); the webhook grants
      // access for exactly `duration` months and there's no Stripe
      // subscription left behind that could ever charge again.
      const returnBase = checkoutReturnBase(ctx.req);
      const buildSessionParams =(customer: string): Stripe.Checkout.SessionCreateParams => ({
        customer,
        line_items: lineItems,
        metadata,
        success_url: `${returnBase}/subscriptions?checkout=success`,
        cancel_url: `${returnBase}/subscriptions?checkout=cancel`,
        ...(input.isAutoRenew
          ? { mode: "subscription", subscription_data: { metadata } }
          : { mode: "payment", payment_intent_data: { metadata } }),
      });

      let session: Stripe.Checkout.Session;
      try {
        try {
          session = await getStripe().checkout.sessions.create(buildSessionParams(stripeCustomerId));
        } catch (err) {
          // A stored customer id can go stale (deleted in the dashboard, or
          // created under the other test/live key) -- recreate it once.
          if (!isMissingCustomerError(err)) throw err;
          session = await getStripe().checkout.sessions.create(buildSessionParams(await createCustomer()));
        }
      } catch (err) {
        await discardPendingCheckout(subscription!.id, contributionId);
        throw checkoutError(`subscription checkout (subscription #${subscription!.id})`, err);
      }

      if (!session.url) {
        await discardPendingCheckout(subscription!.id, contributionId);
        console.error("[stripe] subscription checkout returned no url", { sessionId: session.id });
        throw checkoutError("subscription checkout", new Error("Checkout Session has no url"));
      }

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

  contributions: authedQuery.query(async ({ ctx }) => {
    return findContributionsByParent(ctx.user.id);
  }),
});
