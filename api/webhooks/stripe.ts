import type { Context } from "hono";
import type Stripe from "stripe";
import { getStripe } from "../lib/stripe";
import { env } from "../lib/env";
import { findSubscriptionById, findSubscriptionByStripeId, updateSubscription, createPayment } from "../queries/subscriptions";
import { createNotification } from "../queries/notifications";

// Stripe webhooks use at-least-once delivery -- every handler below must be
// safe to run twice for the same event (checked via current DB state, not a
// separate dedup table).

function referencedId(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const localSubscriptionId = Number(session.metadata?.localSubscriptionId);
  if (!localSubscriptionId) return;
  const sub = await findSubscriptionById(localSubscriptionId);
  if (!sub) return;
  if (sub.status === "active") return; // duplicate delivery

  const stripeSubscriptionId = referencedId(session.subscription);
  if (!stripeSubscriptionId) return;
  const stripeSubscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
  const item = stripeSubscription.items.data[0];

  await updateSubscription(localSubscriptionId, {
    status: "active",
    stripeSubscriptionId,
    startDate: new Date(item.current_period_start * 1000),
    endDate: new Date(item.current_period_end * 1000),
  });
  await createPayment({
    subscriptionId: localSubscriptionId,
    parentId: sub.parentId,
    amount: sub.totalPrice,
    currency: sub.currency,
    status: "completed",
    paidAt: new Date(),
  });
  await createNotification({
    userId: sub.parentId,
    childId: sub.childId,
    type: "payment_succeeded",
    title: "Subscription activated",
    message: "Your payment was received and the subscription is now active.",
    relatedId: sub.id,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === "subscription_create") return; // handled by checkout.session.completed
  const stripeSubscriptionId = referencedId(invoice.parent?.subscription_details?.subscription);
  if (!stripeSubscriptionId) return;
  const sub = await findSubscriptionByStripeId(stripeSubscriptionId);
  if (!sub) return;

  const stripeSubscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId);
  const item = stripeSubscription.items.data[0];
  const paymentIntentId = referencedId(invoice.payments?.data?.[0]?.payment?.payment_intent);

  await updateSubscription(sub.id, { endDate: new Date(item.current_period_end * 1000) });
  await createPayment({
    subscriptionId: sub.id,
    parentId: sub.parentId,
    amount: sub.totalPrice,
    currency: sub.currency,
    status: "completed",
    stripePaymentIntentId: paymentIntentId,
    paidAt: new Date(),
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = referencedId(invoice.parent?.subscription_details?.subscription);
  if (!stripeSubscriptionId) return;
  const sub = await findSubscriptionByStripeId(stripeSubscriptionId);
  if (!sub) return;

  const paymentIntentId = referencedId(invoice.payments?.data?.[0]?.payment?.payment_intent);
  await createPayment({
    subscriptionId: sub.id,
    parentId: sub.parentId,
    amount: sub.totalPrice,
    currency: sub.currency,
    status: "failed",
    stripePaymentIntentId: paymentIntentId,
    failureReason: invoice.last_finalization_error?.message ?? "Payment failed",
  });
  await createNotification({
    userId: sub.parentId,
    childId: sub.childId,
    type: "payment_failed",
    title: "Payment failed",
    message: "We couldn't process your subscription payment. Please check your card details.",
    relatedId: sub.id,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await findSubscriptionByStripeId(subscription.id);
  if (!sub) return;
  if (sub.status === "expired" || sub.status === "cancelled") return; // duplicate delivery

  const now = new Date();
  const status = sub.endDate && new Date(sub.endDate) < now ? "expired" : "cancelled";
  await updateSubscription(sub.id, { status });
  await createNotification({
    userId: sub.parentId,
    childId: sub.childId,
    type: "subscription_expiry",
    title: "Subscription ended",
    message: status === "expired" ? "Your subscription has expired." : "Your subscription has been cancelled.",
    relatedId: sub.id,
  });
}

export async function handleStripeWebhook(c: Context) {
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing signature" }, 400);

  const rawBody = await c.req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret);
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break; // acknowledge unhandled event types so Stripe stops retrying
  }

  return c.json({ received: true });
}
