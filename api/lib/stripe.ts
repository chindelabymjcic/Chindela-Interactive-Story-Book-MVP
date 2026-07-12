import Stripe from "stripe";
import { env } from "./env";

let instance: Stripe | undefined;

// Throws lazily, only when actually invoked with no key configured, so
// typecheck/build/tests stay green with blank Stripe env vars (matches the
// dev-tolerant pattern used by the rest of env.ts).
export function getStripe(): Stripe {
  if (!instance) {
    if (!env.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    instance = new Stripe(env.stripeSecretKey, { apiVersion: "2026-06-24.dahlia" });
  }
  return instance;
}

export const MONTHLY_PRICE_GBP_PENCE = 100; // £1.00

export function computeCancelAt(durationMonths: 1 | 3 | 6 | 12): number {
  const cancelAt = new Date();
  cancelAt.setMonth(cancelAt.getMonth() + durationMonths);
  return Math.floor(cancelAt.getTime() / 1000);
}
