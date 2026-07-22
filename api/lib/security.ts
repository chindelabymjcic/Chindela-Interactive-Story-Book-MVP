import type { MiddlewareHandler } from "hono";
import { env } from "./env";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientKey(request: Request) {
  // Hosting platforms commonly provide this header. It is intentionally only
  // used as a rate-limit key, never as an authentication or authorization fact.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// The browser uploads media directly to S3 via a presigned POST (see
// api/lib/storage.ts), so connect-src must allow that exact bucket origin --
// only added when S3 is actually configured, to keep the policy minimal
// otherwise.
const s3ConnectSrc = env.awsS3Bucket && env.awsRegion
  ? `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com`
  : "";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self'",
  `connect-src 'self'${s3ConnectSrc ? ` ${s3ConnectSrc}` : ""}`,
].join("; ") + ";";

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header("Content-Security-Policy", CSP);
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
  if (!origin) {
    // Non-browser clients do not send Origin. Browser mutation requests must
    // be same-origin, which protects the cookie-authenticated API from CSRF.
    await next();
    return;
  }
  // Behind a reverse proxy (Railway, etc.), TLS terminates at the edge and
  // the container only ever sees a plain-HTTP request -- c.req.url would
  // report "http://" even though the browser's real Origin is "https://",
  // making every same-origin POST fail this check. Trust the standard
  // forwarded headers the proxy sets to reconstruct the request's real,
  // externally-visible origin before comparing.
  const forwardedProto = c.req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = c.req.header("x-forwarded-host")?.split(",")[0]?.trim();
  const requestOrigin = forwardedProto && forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(c.req.url).origin;
  if (origin !== requestOrigin) {
    return c.json({ error: "Cross-origin requests are not allowed" }, 403);
  }
  await next();
};

