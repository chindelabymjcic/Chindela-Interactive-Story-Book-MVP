import type { MiddlewareHandler } from "hono";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  // Hosting platforms commonly provide this header. It is intentionally only
  // used as a rate-limit key, never as an authentication or authorization fact.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self';",
  );
  if (new URL(c.req.url).protocol === "https:") {
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
};

export const rateLimit: MiddlewareHandler = async (c, next) => {
  const now = Date.now();
  const key = clientKey(c.req.raw);
  const bucket = buckets.get(key);
  const current = !bucket || bucket.resetAt <= now ? { count: 0, resetAt: now + WINDOW_MS } : bucket;
  current.count += 1;
  buckets.set(key, current);

  if (current.count > MAX_REQUESTS_PER_WINDOW) {
    c.header("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
    return c.json({ error: "Too many requests" }, 429);
  }
  await next();
};

export const sameOrigin: MiddlewareHandler = async (c, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) return next();
  const origin = c.req.header("origin");
  // Non-browser clients do not send Origin. Browser mutation requests must be
  // same-origin, which protects the cookie-authenticated API from CSRF.
  if (origin && origin !== new URL(c.req.url).origin) {
    return c.json({ error: "Cross-origin requests are not allowed" }, 403);
  }
  await next();
};
