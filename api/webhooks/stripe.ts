import type { Context } from "hono";
import type Stripe from "stripe";
import { getStripe, addMonths } from "../lib/stripe";
import { env } from "../lib/env";
import { findSubscriptionById, findSubscriptionByStripeId, updateSubscription, createPayment } from "../queries/subscriptions";
import { findContributionById, updateContributionStatus } from "../queries/contributions";
import { createNotification } from "../queries/notifications";
import { getDb } from "../queries/connection";
import { findUserById } from "../queries/users";
import { sendEmail } from "../lib/email";
import { subscriptionConfirmationEmail, paymentReceiptEmail, paymentFailedEmail, contributionReceiptEmail, donationReceiptEmail, adminAlertEmail, parentNotificationEmail } from "../lib/emailTemplates";

// Stripe webhooks use at-least-once delivery -- every handler below must be
// safe to run twice for the same event (checked via current DB state, not a
// separate dedup table). Each handler's writes run inside a single
// db.transaction() so a crash between statements can't leave the local
// subscription/payment/notification rows in an inconsistent state.

function referencedId(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

// Public homepage donation: no local user/child/subscription exists, and
// Stripe is the system of record, so this only sends the receipts. Stripe
// redelivers only on a non-2xx response, so duplicate receipts are unlikely.
async function handleDonationCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const amount = ((session.amount_total ?? 0) / 100).toFixed(2);
  const donorEmail = session.customer_details?.email ?? session.customer_email ?? undefined;
  const donorName = session.metadata?.donorName || session.customer_details?.name || "friend";

  if (donorEmail) {
    await sendEmail({ to: donorEmail, ...donationReceiptEmail({ name: donorName, amount }) });
  }
  if (env.adminEmail) {
    await sendEmail({
      to: env.adminEmail,
      ...adminAlertEmail({
        subject: "New donation received",
        message: `A general donation of £${amount} was received from ${donorName}${donorEmail ? ` (${donorEmail})` : ""}. Stripe Checkout Session: ${session.id}`,
      }),
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind === "general_donation") {
    await handleDonationCompleted(session);
    return;
  }

  const localSubscriptionId = Number(session.metadata?.localSubscriptionId);
  if (!localSubscriptionId) return;
  if (session.payment_status === "unpaid") return; // not paid yet -- nothing to grant
  const sub = await findSubscriptionById(localSubscriptionId);
  if (!sub) return;

  const localContributionId = Number(session.metadata?.localContributionId) || undefined;

  let stripeSubscriptionId: string | undefined;
  let paymentIntentId: string | undefined;
  let startDate: Date;
  let endDate: Date;

  if (session.mode === "payment") {
    // Auto-renew OFF: a single one-time charge buys exactly `duration` months
    // of access. There's no Stripe subscription -- access ends via endDate
    // (the same mechanism admin-approved subscriptions use).
    paymentIntentId = referencedId(session.payment_intent);
    startDate = new Date();
    endDate = addMonths(startDate, sub.duration);
  } else {
    stripeSubscriptionId = referencedId(session.subscription);
    if (!stripeSubscriptionId) return;

    // Subscription-mode Checkout has no session.payment_intent -- the one-time
    // contribution line item (if any) is billed on the subscription's first
    // invoice, so the payment intent lives there instead.
    const stripeSubscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId, {
      expand: ["latest_invoice"],
    });
    const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice | null;
    paymentIntentId = referencedId(latestInvoice?.payments?.data?.[0]?.payment?.payment_intent);
    const item = stripeSubscription.items.data[0];
    startDate = new Date(item.current_period_start * 1000);
    endDate = new Date(item.current_period_end * 1000);
  }

  if (sub.status === "active") {
    // Subscription side already handled by an earlier delivery -- but the
    // contribution row is updated independently in case this retry is the
    // first delivery to actually carry contribution metadata.
    if (localContributionId) await activateContributionIfPending(localContributionId, paymentIntentId);
    return;
  }

  await getDb().transaction(async (tx) => {
    await updateSubscription(
      localSubscriptionId,
      {
        status: "active",
        ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
        startDate,
        endDate,
      },
      tx,
    );
    await createPayment(
      {
        subscriptionId: localSubscriptionId,
        parentId: sub.parentId,
        amount: sub.totalPrice,
        currency: sub.currency,
        status: "completed",
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      },
      tx,
    );
    await createNotification(
      {
        userId: sub.parentId,
        childId: sub.childId,
        type: "payment_succeeded",
        title: "Subscription activated",
        message: "Your payment was received and the subscription is now active.",
        relatedId: sub.id,
      },
      tx,
    );
    if (localContributionId) {
      await updateContributionStatus(localContributionId, "completed", { stripePaymentIntentId: paymentIntentId }, tx);
    }
  });

  if (localContributionId) {
    await createNotification({
      userId: sub.parentId,
      childId: sub.childId,
      type: "system",
      title: "Thank you for your contribution",
      message: "Your optional contribution was received. Thank you for supporting Chindela Storybook!",
      relatedId: localContributionId,
    });
  }

  const parent = await findUserById(sub.parentId);
  if (parent) {
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
        date: new Date().toLocaleDateString("en-GB"),
        description: `Subscription — ${sub.ageGroup?.name ?? ""} (${sub.duration} month(s))`,
      }),
    });
    if (localContributionId) {
      const contribution = await findContributionById(localContributionId);
      if (contribution) {
        await sendEmail({
          to: parent.email,
          ...contributionReceiptEmail({ name: parent.name ?? parent.email, amount: contribution.amount }),
        });
      }
    }
  }
}

// Only reached when the subscription itself was already activated by a prior
// webhook delivery -- keeps the contribution row from being stuck "pending"
// forever if it arrived out of order relative to the subscription-activating event.
async function activateContributionIfPending(contributionId: number, paymentIntentId?: string) {
  const contribution = await findContributionById(contributionId);
  if (!contribution || contribution.status !== "pending") return;
  await updateContributionStatus(contributionId, "completed", { stripePaymentIntentId: paymentIntentId });
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

  await getDb().transaction(async (tx) => {
    await updateSubscription(sub.id, { endDate: new Date(item.current_period_end * 1000) }, tx);
    await createPayment(
      {
        subscriptionId: sub.id,
        parentId: sub.parentId,
        amount: sub.totalPrice,
        currency: sub.currency,
        status: "completed",
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      },
      tx,
    );
  });

  const parent = await findUserById(sub.parentId);
  if (parent) {
    await sendEmail({
      to: parent.email,
      ...paymentReceiptEmail({
        name: parent.name ?? parent.email,
        amount: sub.totalPrice,
        date: new Date().toLocaleDateString("en-GB"),
        description: `Subscription renewal — ${sub.ageGroup?.name ?? ""}`,
      }),
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const stripeSubscriptionId = referencedId(invoice.parent?.subscription_details?.subscription);
  if (!stripeSubscriptionId) return;
  const sub = await findSubscriptionByStripeId(stripeSubscriptionId);
  if (!sub) return;

  const paymentIntentId = referencedId(invoice.payments?.data?.[0]?.payment?.payment_intent);

  await getDb().transaction(async (tx) => {
    await createPayment(
      {
        subscriptionId: sub.id,
        parentId: sub.parentId,
        amount: sub.totalPrice,
        currency: sub.currency,
        status: "failed",
        stripePaymentIntentId: paymentIntentId,
        failureReason: invoice.last_finalization_error?.message ?? "Payment failed",
      },
      tx,
    );
    await createNotification(
      {
        userId: sub.parentId,
        childId: sub.childId,
        type: "payment_failed",
        title: "Payment failed",
        message: "We couldn't process your subscription payment. Please check your card details.",
        relatedId: sub.id,
      },
      tx,
    );
  });

  const failureReason = invoice.last_finalization_error?.message ?? "Payment failed";
  const parent = await findUserById(sub.parentId);
  if (parent) {
    await sendEmail({ to: parent.email, ...paymentFailedEmail({ name: parent.name ?? parent.email, reason: failureReason }) });
  }
  if (env.adminEmail) {
    await sendEmail({
      to: env.adminEmail,
      ...adminAlertEmail({
        subject: "Subscription payment failed",
        message: `Payment failed for subscription #${sub.id} (parent: ${parent?.email ?? sub.parentId}). Reason: ${failureReason}`,
      }),
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = await findSubscriptionByStripeId(subscription.id);
  if (!sub) return;
  if (sub.status === "expired" || sub.status === "cancelled") return; // terminal locally; deletion webhook owns this

  const item = subscription.items.data[0];
  const endDate = item ? new Date(item.current_period_end * 1000) : sub.endDate ? new Date(sub.endDate) : undefined;

  let status: "active" | "expired" | "cancelled" | "pending" = sub.status;
  if (subscription.status === "active" || subscription.status === "trialing") {
    status = "active";
  } else if (subscription.status === "canceled") {
    status = endDate && endDate < new Date() ? "expired" : "cancelled";
  }
  // Other Stripe statuses (past_due, unpaid, incomplete, paused) don't map to a
  // local status change here -- invoice.payment_failed already notified the
  // parent, and customer.subscription.deleted is the source of truth for
  // terminating access.

  const endDateChanged = endDate && (!sub.endDate || endDate.getTime() !== new Date(sub.endDate).getTime());
  if (status === sub.status && !endDateChanged) return; // no-op, skip the write

  await getDb().transaction(async (tx) => {
    await updateSubscription(sub.id, { status, ...(endDate ? { endDate } : {}) }, tx);
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = await findSubscriptionByStripeId(subscription.id);
  if (!sub) return;
  if (sub.status === "expired" || sub.status === "cancelled") return; // duplicate delivery

  const now = new Date();
  const status = sub.endDate && new Date(sub.endDate) < now ? "expired" : "cancelled";
  const message = status === "expired" ? "Your subscription has expired." : "Your subscription has been cancelled.";

  await getDb().transaction(async (tx) => {
    await updateSubscription(sub.id, { status }, tx);
    await createNotification(
      {
        userId: sub.parentId,
        childId: sub.childId,
        type: "subscription_expiry",
        title: "Subscription ended",
        message,
        relatedId: sub.id,
      },
      tx,
    );
  });

  const parent = await findUserById(sub.parentId);
  if (parent) {
    await sendEmail({ to: parent.email, ...parentNotificationEmail({ name: parent.name ?? parent.email, title: "Subscription ended", message }) });
  }
}

export async function handleStripeWebhook(c: Context) {
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Missing signature" }, 400);

  const rawBody = await c.req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.error(
      env.stripeWebhookSecret
        ? `[stripe] webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`
        : "[stripe] STRIPE_WEBHOOK_SECRET is not configured -- webhook events cannot be verified",
    );
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
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      break; // acknowledge unhandled event types so Stripe stops retrying
  }

  return c.json({ received: true });
}
