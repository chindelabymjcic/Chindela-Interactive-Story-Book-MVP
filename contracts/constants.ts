export const Session = {
  cookieName: "chindela_session",
  childCookieName: "chindela_child_session",
  maxAgeMs: 12 * 60 * 60 * 1000,
  rememberMeMaxAgeMs: 30 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
} as const;

// Flat pricing, same for every age group: total price is exactly
// duration (months) x £2.00, charged as a single one-time-per-period amount.
export const SubscriptionDurations = [1, 2, 3, 6, 12] as const;
export type SubscriptionDuration = (typeof SubscriptionDurations)[number];

export const SUBSCRIPTION_PRICE_PER_MONTH_GBP_PENCE = 200;

export const SubscriptionPricingGBPPence: Record<SubscriptionDuration, number> = {
  1: 200,
  2: 400,
  3: 600,
  6: 1200,
  12: 2400,
};

// Optional one-time contribution collected alongside a subscription checkout.
export const ContributionLimits = {
  minGBPPence: 100, // £1.00
  maxGBPPence: 100_000, // £1,000.00
} as const;

// Public one-time donation from the homepage -- no account, child, age group
// or subscription involved. Separate from ContributionLimits on purpose so the
// two flows can diverge without affecting each other.
export const DonationLimits = {
  minGBPPence: 100, // £1.00
  maxGBPPence: 100_000, // £1,000.00
} as const;
export const DonationPresetsGBPPence = [500, 1000, 2000, 5000] as const;

// ============== MEDIA / CMS UPLOADS ==============
export const MediaCategories = ["image", "audio", "video", "pdf", "document"] as const;
export type MediaCategory = (typeof MediaCategories)[number];

export const MediaConstraints: Record<MediaCategory, { mimeTypes: string[]; maxSizeBytes: number; extensions: string[] }> = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
    maxSizeBytes: 10 * 1024 * 1024,
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"],
  },
  audio: {
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm"],
    maxSizeBytes: 50 * 1024 * 1024,
    extensions: [".mp3", ".wav", ".ogg", ".m4a", ".weba"],
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    maxSizeBytes: 500 * 1024 * 1024,
    extensions: [".mp4", ".webm", ".mov"],
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    maxSizeBytes: 25 * 1024 * 1024,
    extensions: [".pdf"],
  },
  document: {
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ],
    maxSizeBytes: 25 * 1024 * 1024,
    extensions: [".doc", ".docx", ".txt", ".csv"],
  },
};

export const MediaListDefaults = {
  pageSize: 24,
  maxPageSize: 100,
} as const;
