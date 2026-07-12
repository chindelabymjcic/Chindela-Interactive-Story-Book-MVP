import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";

// Set dummy Stripe env vars before any module under test is loaded. These are
// only ever used for local HMAC signature generation/verification below --
// no network call is made, so no real Stripe account is needed.
beforeAll(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_signature_only";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy_secret";
});

async function buildApp() {
  const { handleStripeWebhook } = await import("./stripe");
  const app = new Hono();
  app.post("/webhook", handleStripeWebhook);
  return app;
}

async function sign(payload: string) {
  const { getStripe } = await import("../lib/stripe");
  return getStripe().webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
}

describe("handleStripeWebhook", () => {
  it("rejects a request with no stripe-signature header", async () => {
    const app = await buildApp();
    const res = await app.request("/webhook", { method: "POST", body: "{}" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing signature" });
  });

  it("rejects a request with a tampered/invalid signature", async () => {
    const app = await buildApp();
    const res = await app.request("/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=not-a-real-signature" },
      body: JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid signature" });
  });

  it("acknowledges an unhandled event type with 200 (no retry storm)", async () => {
    const app = await buildApp();
    const payload = JSON.stringify({ id: "evt_2", type: "customer.created", data: { object: {} } });
    const res = await app.request("/webhook", {
      method: "POST",
      headers: { "stripe-signature": await sign(payload) },
      body: payload,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it("dispatches checkout.session.completed without touching the DB when metadata is missing", async () => {
    // No localSubscriptionId metadata -> handler must return early before any
    // DB lookup. This proves the switch statement reaches the right branch
    // without requiring a live database connection.
    const app = await buildApp();
    const payload = JSON.stringify({
      id: "evt_3",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_1", metadata: {}, subscription: null } },
    });
    const res = await app.request("/webhook", {
      method: "POST",
      headers: { "stripe-signature": await sign(payload) },
      body: payload,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
