import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";
import type { User } from "@db/schema";

// Stripe and the DB are mocked: these tests assert the exact Checkout Session
// parameters each flow sends, which is where the auto-renew OFF bug lived
// (an invalid subscription_data.cancel_at that Stripe rejected outright).
const sessionsCreate = vi.fn();
const customersCreate = vi.fn();

vi.mock("./lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/stripe")>();
  return {
    ...actual,
    getStripe: () => ({ checkout: { sessions: { create: sessionsCreate } }, customers: { create: customersCreate } }),
  };
});
vi.mock("./queries/children", () => ({
  findChildById: vi.fn(async (id: number) => (id === 7 ? { id: 7, parentId: 1, name: "Amara", ageGroupId: 3 } : undefined)),
}));
vi.mock("./queries/ageGroups", () => ({
  findAgeGroupById: vi.fn(async (id: number) => (id === 3 ? { id: 3, name: "5-7" } : undefined)),
}));
const cancelSubscription = vi.fn();
vi.mock("./queries/subscriptions", () => ({
  createSubscription: vi.fn(async (data: object) => ({ id: 42, ...data })),
  cancelSubscription: (...args: unknown[]) => cancelSubscription(...args),
  findSubscriptionsByParent: vi.fn(),
  findActiveSubscription: vi.fn(),
  findSubscriptionById: vi.fn(),
  findPaymentsByParent: vi.fn(),
}));
const updateContributionStatus = vi.fn();
vi.mock("./queries/contributions", () => ({
  createContribution: vi.fn(async () => 9),
  findContributionsByParent: vi.fn(),
  updateContributionStatus: (...args: unknown[]) => updateContributionStatus(...args),
}));
vi.mock("./queries/users", () => ({ setStripeCustomerId: vi.fn(), findUserById: vi.fn() }));

const parent = { id: 1, email: "parent@example.com", name: "Pat", role: "user", stripeCustomerId: "cus_existing" } as unknown as User;

async function caller(user?: User) {
  const { appRouter } = await import("./router");
  return appRouter.createCaller({ req: new Request("http://localhost"), resHeaders: new Headers(), user });
}

beforeEach(() => {
  sessionsCreate.mockReset().mockResolvedValue({ id: "cs_test", url: "https://checkout.stripe.com/c/pay/cs_test" });
  customersCreate.mockReset().mockResolvedValue({ id: "cus_new" });
  cancelSubscription.mockReset();
  updateContributionStatus.mockReset();
});

describe("subscription.create checkout", () => {
  const base = { childId: 7, ageGroupId: 3, duration: 3 as const };

  it("auto-renew OFF: one-time payment for the full duration, never a subscription or cancel_at", async () => {
    const res = await (await caller(parent)).subscription.create({ ...base, isAutoRenew: false });
    expect(res.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_test");

    const params = sessionsCreate.mock.calls[0][0];
    expect(params.mode).toBe("payment");
    expect(params.subscription_data).toBeUndefined();
    expect(JSON.stringify(params)).not.toContain("cancel_at");
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0].price_data.unit_amount).toBe(600);
    expect(params.line_items[0].price_data.recurring).toBeUndefined();
    expect(params.metadata).toMatchObject({ kind: "child_subscription", localSubscriptionId: "42", autoRenew: "false", durationMonths: "3" });
    expect(params.payment_intent_data.metadata.localSubscriptionId).toBe("42");
  });

  it("auto-renew ON: recurring subscription billing the full duration price every `duration` months", async () => {
    await (await caller(parent)).subscription.create({ ...base, isAutoRenew: true });
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.mode).toBe("subscription");
    expect(params.line_items[0].price_data.unit_amount).toBe(600);
    expect(params.line_items[0].price_data.recurring).toEqual({ interval: "month", interval_count: 3 });
    expect(params.subscription_data.metadata.localSubscriptionId).toBe("42");
    expect(params.payment_intent_data).toBeUndefined();
  });

  it("works with no contribution (single line item, no contribution metadata)", async () => {
    await (await caller(parent)).subscription.create({ ...base, isAutoRenew: false });
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.line_items).toHaveLength(1);
    expect(params.metadata.localContributionId).toBeUndefined();
  });

  it.each([true, false])("adds the contribution as a separate one-time line item (auto-renew %s)", async (isAutoRenew) => {
    await (await caller(parent)).subscription.create({ ...base, isAutoRenew, contributionGBPPence: 500 });
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.line_items).toHaveLength(2);
    expect(params.line_items[0].price_data.unit_amount).toBe(600); // subscription amount untouched
    expect(params.line_items[1].price_data.unit_amount).toBe(500);
    expect(params.line_items[1].price_data.recurring).toBeUndefined(); // never recurs
    expect(params.metadata.localContributionId).toBe("9");
  });

  it("rejects a child that belongs to another parent before touching Stripe", async () => {
    await expect((await caller(parent)).subscription.create({ ...base, childId: 999, isAutoRenew: false })).rejects.toThrow();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("requires login", async () => {
    await expect((await caller()).subscription.create({ ...base, isAutoRenew: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("surfaces a readable error (not the raw Stripe message) and closes out the pending rows", async () => {
    sessionsCreate.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({ type: "invalid_request_error", message: "Received unknown parameter: x" }),
    );
    const err = await (await caller(parent)).subscription.create({ ...base, isAutoRenew: false, contributionGBPPence: 500 }).catch((e) => e);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err.message).toMatch(/couldn't start the secure checkout/);
    expect(err.message).not.toContain("unknown parameter");
    expect(cancelSubscription).toHaveBeenCalledWith(42);
    expect(updateContributionStatus).toHaveBeenCalledWith(9, "failed");
  });

  it("recreates a stale Stripe customer once and retries", async () => {
    sessionsCreate
      .mockRejectedValueOnce(
        new Stripe.errors.StripeInvalidRequestError({ type: "invalid_request_error", code: "resource_missing", param: "customer", message: "No such customer" }),
      )
      .mockResolvedValueOnce({ id: "cs_retry", url: "https://checkout.stripe.com/c/pay/cs_retry" });
    const res = await (await caller(parent)).subscription.create({ ...base, isAutoRenew: false });
    expect(res.checkoutUrl).toContain("cs_retry");
    expect(sessionsCreate.mock.calls[1][0].customer).toBe("cus_new");
  });

  it("errors instead of silently doing nothing when Stripe returns no url", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_nourl", url: null });
    await expect((await caller(parent)).subscription.create({ ...base, isAutoRenew: true })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("donation.createCheckout (public general donation)", () => {
  it("needs no login, child, age group or subscription", async () => {
    const res = await (await caller()).donation.createCheckout({ amountGBPPence: 1000 });
    expect(res.checkoutUrl).toBe("https://checkout.stripe.com/c/pay/cs_test");
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.mode).toBe("payment");
    expect(params.submit_type).toBe("donate");
    expect(params.customer).toBeUndefined();
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items[0].price_data.unit_amount).toBe(1000);
    expect(params.line_items[0].price_data.recurring).toBeUndefined();
    expect(params.metadata).toEqual({ kind: "general_donation" });
    expect(params.success_url).toMatch(/\/donate\?donation=success$/);
    expect(params.cancel_url).toMatch(/\/donate\?donation=cancel$/);
  });

  it("passes optional donor details through", async () => {
    await (await caller()).donation.createCheckout({ amountGBPPence: 250, donorName: "Sam", donorEmail: "sam@example.com" });
    const params = sessionsCreate.mock.calls[0][0];
    expect(params.customer_email).toBe("sam@example.com");
    expect(params.metadata.donorName).toBe("Sam");
  });

  it.each([0, 99, 100_001, 12.5])("rejects invalid amount %s before calling Stripe", async (amountGBPPence) => {
    await expect((await caller()).donation.createCheckout({ amountGBPPence })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a malformed donor email", async () => {
    await expect((await caller()).donation.createCheckout({ amountGBPPence: 500, donorEmail: "nope" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("addMonths", () => {
  it("adds calendar months and clamps to month end", async () => {
    const { addMonths } = await import("./lib/stripe");
    expect(addMonths(new Date(2026, 0, 15), 3)).toEqual(new Date(2026, 3, 15));
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2026, 10, 30), 12)).toEqual(new Date(2027, 10, 30));
  });
});

describe("checkoutReturnBase", () => {
  const req = (origin?: string) => new Request("http://internal", { headers: origin ? { origin } : {} });

  it("returns users to the production domain they started on (keeps their login cookie)", async () => {
    const { checkoutReturnBase } = await import("./lib/stripe");
    expect(checkoutReturnBase(req("https://www.chindela-bymjcic.com"))).toBe("https://www.chindela-bymjcic.com");
    expect(checkoutReturnBase(req("https://chindela-bymjcic.com"))).toBe("https://chindela-bymjcic.com");
  });

  it("falls back to APP_URL, without a trailing slash, for unknown or missing origins", async () => {
    const { checkoutReturnBase } = await import("./lib/stripe");
    const { env } = await import("./lib/env");
    const fallback = env.appUrl.replace(/\/+$/, "");
    expect(checkoutReturnBase(req("https://evil.example"))).toBe(fallback);
    expect(checkoutReturnBase(req("http://www.chindela-bymjcic.com"))).toBe(fallback); // https only
    expect(checkoutReturnBase(req())).toBe(fallback);
    expect(checkoutReturnBase(req("not a url"))).toBe(fallback);
    expect(checkoutReturnBase(req()).endsWith("/")).toBe(false);
  });

  it("builds checkout return URLs from the caller's origin", async () => {
    const { appRouter } = await import("./router");
    const c = appRouter.createCaller({
      req: new Request("http://internal", { headers: { origin: "https://www.chindela-bymjcic.com" } }),
      resHeaders: new Headers(),
      user: parent,
    });
    await c.subscription.create({ childId: 7, ageGroupId: 3, duration: 1, isAutoRenew: false });
    await c.donation.createCheckout({ amountGBPPence: 500 });
    expect(sessionsCreate.mock.calls[0][0].success_url).toBe("https://www.chindela-bymjcic.com/subscriptions?checkout=success");
    expect(sessionsCreate.mock.calls[1][0].cancel_url).toBe("https://www.chindela-bymjcic.com/donate?donation=cancel");
  });
});
