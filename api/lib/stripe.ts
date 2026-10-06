import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
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

const KNOWN_PUBLIC_HOSTS = ["www.chindela-bymjcic.com", "chindela-bymjcic.com"];

// Where Stripe sends the browser back after checkout. Returning to the same
// origin the user started on keeps them on the domain their login cookie
// belongs to (APP_URL may name the *.up.railway.app domain, and a trailing
// slash in it used to produce "//subscriptions", which no route matches).
// The Origin header is only honoured for known hosts, so a crafted request
// can't make a checkout link that returns somewhere else.
export function checkoutReturnBase(req: Request): string {
  const fallback = env.appUrl.replace(/\/+$/, "");
  const origin = req.headers.get("origin");
  if (!origin) return fallback;
  try {
    const url = new URL(origin);
    const allowed =
      url.origin === new URL(fallback).origin ||
      (url.protocol === "https:" && KNOWN_PUBLIC_HOSTS.includes(url.hostname)) ||
      (!env.isProduction && (url.hostname === "localhost" || url.hostname === "127.0.0.1"));
    return allowed ? url.origin : fallback;
  } catch {
    return fallback;
  }
}

// Calendar-month addition (e.g. 31 Jan + 1 month clamps to the end of Feb
// rather than spilling into March), used for fixed-term access windows.
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfMonth));
  return result;
}

// Checkout Session creation is the one Stripe call a user waits on directly,
// so a failure there must reach them as a readable message (never swallowed,
// never a raw Stripe parameter error) while the server log keeps enough detail
// -- Stripe error type/code/param/request id, never the key -- to diagnose it.
export function checkoutError(context: string, err: unknown): TRPCError {
  if (err instanceof TRPCError) return err;
  if (err instanceof Stripe.errors.StripeError) {
    console.error(`[stripe] ${context} failed`, {
      type: err.type,
      code: err.code,
      param: err.param,
      statusCode: err.statusCode,
      requestId: err.requestId,
      message: err.message,
    });
    const userMessage =
      err.type === "StripeCardError"
        ? err.message
        : err.type === "StripeConnectionError" || err.type === "StripeAPIError"
          ? "We couldn't reach our payment provider. Please try again in a moment."
          : "We couldn't start the secure checkout. Please try again, or contact us if this keeps happening.";
    return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: userMessage, cause: err });
  }
  console.error(`[stripe] ${context} failed`, err);
  const notConfigured = err instanceof Error && err.message.includes("STRIPE_SECRET_KEY");
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: notConfigured
      ? "Online payments are temporarily unavailable. Please try again later."
      : "We couldn't start the secure checkout. Please try again, or contact us if this keeps happening.",
    cause: err,
  });
}

export function isMissingCustomerError(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing" && err.param === "customer";
}
