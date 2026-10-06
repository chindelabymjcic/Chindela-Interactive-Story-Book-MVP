import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { Hono } from "hono";

// checkout.session.completed for each checkout kind, with DB/email mocked.
// Stripe itself is only used locally to sign the test payloads.
beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_signature_only";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy_secret";
});

const sendEmail = vi.fn();
vi.mock("../lib/email", () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));

const updateSubscription = vi.fn();
const createPayment = vi.fn();
const findSubscriptionById = vi.fn();
vi.mock("../queries/subscriptions", () => ({
  findSubscriptionById: (...a: unknown[]) => findSubscriptionById(...a),
  findSubscriptionByStripeId: vi.fn(),
  updateSubscription: (...a: unknown[]) => updateSubscription(...a),
  createPayment: (...a: unknown[]) => createPayment(...a),
}));
const updateContributionStatus = vi.fn();
vi.mock("../queries/contributions", () => ({
  findContributionById: vi.fn(async () => ({ id: 9, amount: "5.00", status: "pending" })),
  updateContributionStatus: (...a: unknown[]) => updateContributionStatus(...a),
}));
vi.mock("../queries/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("../queries/users", () => ({ findUserById: vi.fn(async () => ({ id: 1, email: "parent@example.com", name: "Pat" })) }));
vi.mock("../queries/connection", () => ({ getDb: () => ({ transaction: async (fn: (tx: object) => unknown) => fn({}) }) }));

const pendingSub = {
  id: 42,
  parentId: 1,
  childId: 7,
  duration: 3,
  totalPrice: "6.00",
  currency: "GBP",
  status: "pending",
  child: { name: "Amara" },
  ageGroup: { name: "5-7" },
};

async function post(object: object) {
  const { handleStripeWebhook } = await import("./stripe");
  const { getStripe } = await import("../lib/stripe");
  const app = new Hono();
  app.post("/webhook", handleStripeWebhook);
  const payload = JSON.stringify({ id: "evt_flow", type: "checkout.session.completed", data: { object } });
  const sig = getStripe().webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
  return app.request("/webhook", { method: "POST", headers: { "stripe-signature": sig }, body: payload });
}

beforeEach(() => {
  vi.clearAllMocks();
  findSubscriptionById.mockResolvedValue({ ...pendingSub });
});

describe("checkout.session.completed — non-renewing (auto-renew OFF) purchase", () => {
  it("activates for exactly `duration` months with no Stripe subscription, and completes the contribution", async () => {
    const before = new Date();
    const res = await post({
      id: "cs_1",
      mode: "payment",
      payment_status: "paid",
      payment_intent: "pi_123",
      subscription: null,
      metadata: { kind: "child_subscription", localSubscriptionId: "42", localContributionId: "9", autoRenew: "false", durationMonths: "3" },
    });
    expect(res.status).toBe(200);

    expect(updateSubscription).toHaveBeenCalledTimes(1);
    const [id, data] = updateSubscription.mock.calls[0];
    expect(id).toBe(42);
    expect(data.status).toBe("active");
    expect(data.stripeSubscriptionId).toBeUndefined();
    const months = (data.endDate.getFullYear() - data.startDate.getFullYear()) * 12 + data.endDate.getMonth() - data.startDate.getMonth();
    expect(months).toBe(3);
    expect(data.startDate.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);

    expect(createPayment.mock.calls[0][0]).toMatchObject({ amount: "6.00", status: "completed", stripePaymentIntentId: "pi_123" });
    expect(updateContributionStatus).toHaveBeenCalledWith(9, "completed", { stripePaymentIntentId: "pi_123" }, {});
  });

  it("ignores an unpaid session", async () => {
    await post({ id: "cs_2", mode: "payment", payment_status: "unpaid", metadata: { localSubscriptionId: "42" } });
    expect(findSubscriptionById).not.toHaveBeenCalled();
    expect(updateSubscription).not.toHaveBeenCalled();
  });

  it("is idempotent on redelivery (already active -> no second activation/payment)", async () => {
    findSubscriptionById.mockResolvedValue({ ...pendingSub, status: "active" });
    await post({ id: "cs_3", mode: "payment", payment_status: "paid", payment_intent: "pi_1", metadata: { localSubscriptionId: "42" } });
    expect(updateSubscription).not.toHaveBeenCalled();
    expect(createPayment).not.toHaveBeenCalled();
  });
});

describe("checkout.session.completed — general donation", () => {
  it("sends the donor a receipt and never touches subscriptions", async () => {
    const res = await post({
      id: "cs_don",
      mode: "payment",
      payment_status: "paid",
      amount_total: 1000,
      customer_details: { email: "donor@example.com", name: "Card Name" },
      metadata: { kind: "general_donation", donorName: "Sam" },
    });
    expect(res.status).toBe(200);
    expect(findSubscriptionById).not.toHaveBeenCalled();
    const donorMail = sendEmail.mock.calls.find(([m]) => m.to === "donor@example.com")?.[0];
    expect(donorMail.subject).toBe("Thank you for your donation");
    expect(donorMail.html).toContain("£10.00");
    expect(donorMail.html).toContain("Sam");
  });

  it("does nothing for an unpaid donation session", async () => {
    await post({ id: "cs_don2", mode: "payment", payment_status: "unpaid", amount_total: 500, metadata: { kind: "general_donation" } });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
