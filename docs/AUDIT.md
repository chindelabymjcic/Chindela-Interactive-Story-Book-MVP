# Chindela Interactive Storybook Platform audit

Audit date: 2026-07-12. Scope: every repository source/configuration file and the four static image assets. This is a Vite React SPA with a Hono/tRPC API and MySQL/Drizzle; it is not a Next.js 15, PostgreSQL, or Prisma application.

## Completion assessment: 32%

| Requirement | Status | Evidence / gap |
|---|---|---|
| TypeScript, Tailwind, shadcn-style UI | Implemented | React TypeScript, Tailwind, Radix-based component set exist. |
| Next.js 15 App Router | Not implemented | `vite.config.ts`, React Router SPA. |
| PostgreSQL / Prisma | Not implemented | MySQL Drizzle schema and connector. |
| Platform parent/admin auth | Partially implemented | This audit replaces Kimi OAuth with hashed-password cookie sessions. Email verification and reset delivery still need a mail provider and token tables. |
| Child login | Partially implemented | Hashed PIN and HTTP-only child session added; rate limiting and PIN reset UX remain. |
| Roles / protected admin API | Partially implemented | tRPC parent/admin middleware exists; client routes are not guarded at router level. |
| Story, lesson, character, safety header, content-year CMS | Partially implemented | API CRUD exists; admin UI only exposes some CRUD and has no media/resource/archive management workflow. |
| Story reader / A4 / responsive | Partially implemented | Reader has an A4 ratio layout, but server-side age/subscription access control is absent. |
| Daily lessons / diary | Partially implemented | Models and diary entry API exist; child diary still contains placeholder history/stats. |
| Audio/image uploads | Not implemented | S3 packages and media schema are unused; URLs are trusted input. |
| Gemini tutor / feedback history | Not implemented | `diaryRouter` uses a random simulated generator; feedback has one record per entry, not conversations. |
| Notifications / email | Partially implemented | In-app records exist; no email service/worker. |
| Stripe / subscriptions | Partially implemented | Subscription/payment records exist, but no Stripe SDK, checkout, webhook, expiry job, or entitlement enforcement. |
| 1/3/6/12-month plans | Partially implemented | Valid durations are now enforced; payment remains unimplemented. |
| Deployment readiness | Not implemented | No CI, test suite, migration baseline, CSP/security headers, secrets guidance beyond `.env.example`, or production operations setup. |

## Security findings

Critical issues fixed in this pass: Kimi OAuth dependency removed; demo child login that accepted every PIN removed; child PINs are now scrypt-hashed; diary creation/feedback delivery now require that child’s signed cookie; browser `localStorage` child session removed; fake payment-completion endpoint removed; subscription duration restricted to the product plans.

High-priority remaining issues: public story/lesson endpoints leak content without age/subscription checks; public content URLs are not upload-safe; no CSRF origin check; no rate limiter or account/PIN lockout; no security headers/CSP; no email verification/reset; no Stripe webhook signature verification; no malware scanning or signed upload policy.

## Data and architecture findings

The schema has Drizzle relations but no database foreign-key definitions or indexes on common joins (`parent_id`, `child_id`, `story_id`, `entry_date`, subscription expiry). `ai_feedback.entry_id` permits only one response and cannot store tutor conversation history. `media` permits multiple nullable owners and has no storage key/checksum. Subscription status is not automatically expired and payments lack unique provider event IDs. The requested PostgreSQL/Prisma migration is a separate, breaking architecture project and was not misrepresented as completed.

## Placeholder inventory

`api/diaryRouter.ts`: simulated random AI feedback. `src/pages/ChildDiary.tsx`: fixed streak/entry totals and fixed previous diary cards. `src/pages/ChildDashboard.tsx`: hard-coded story ID and fallback character/age data. `src/pages/Subscriptions.tsx`: payment simulation UI now points to no completion API and must be replaced by Stripe Checkout. `api/childRouter.ts`: admin list is a non-functional message. `README.md`: unchanged Vite starter text. There are no functional upload endpoints, email sender, Gemini client, or Stripe client.

## Priority order

1. Run a reviewed migration for the authentication schema and configure `SESSION_SECRET`; create the initial admin deliberately.
2. Add rate limits, CSRF/origin protection, CSP/security headers, structured audit logging, and protected route components.
3. Implement Stripe Checkout plus verified webhooks and enforce entitlement/age checks in every story/lesson read.
4. Implement private S3 uploads with MIME/size validation, malware scanning, and signed URLs.
5. Add Gemini behind child-safety moderation, prompt/version logging, conversation tables, and human escalation controls.
6. Add transactional email verification/reset and a scheduled subscription-expiry job.
7. Complete CMS CRUD, resource/archive workflows, test coverage, CI, observability, and replace the Vite/MySQL/Drizzle stack only if Next/Postgres/Prisma are mandatory.
