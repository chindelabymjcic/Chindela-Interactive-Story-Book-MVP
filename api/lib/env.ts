import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "",
  adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN?.trim() ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() ?? "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  appUrl: process.env.APP_URL?.trim() || "http://localhost:3000",
};
