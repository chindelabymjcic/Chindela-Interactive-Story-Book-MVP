export const Session = {
  cookieName: "chindela_session",
  childCookieName: "chindela_child_session",
  maxAgeMs: 12 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
} as const;
