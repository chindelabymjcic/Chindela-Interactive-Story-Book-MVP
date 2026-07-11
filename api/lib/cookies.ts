import type { CookieOptions } from "hono/utils/cookie";

function isLocalhost(headers: Headers): boolean {
  const host = headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    // We do not use cross-site cookie authentication. Lax prevents CSRF while
    // still supporting ordinary top-level navigation back to this application.
    sameSite: "Lax",
    secure: !localhost,
  };
}
