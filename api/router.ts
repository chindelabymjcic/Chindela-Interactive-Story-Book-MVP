import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { childRouter } from "./childRouter";
import { storyRouter } from "./storyRouter";
import { characterRouter } from "./characterRouter";
import { safetyRouter } from "./safetyRouter";
import { diaryRouter } from "./diaryRouter";
import { notificationRouter } from "./notificationRouter";
import { subscriptionRouter } from "./subscriptionRouter";
import { contentYearRouter } from "./contentYearRouter";
import { ageGroupRouter } from "./ageGroupRouter";
import { adminRouter } from "./adminRouter";
import { mediaRouter } from "./mediaRouter";
import { progressRouter } from "./progressRouter";
import { donationRouter } from "./donationRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  child: childRouter,
  story: storyRouter,
  character: characterRouter,
  safety: safetyRouter,
  diary: diaryRouter,
  notification: notificationRouter,
  subscription: subscriptionRouter,
  contentYear: contentYearRouter,
  ageGroup: ageGroupRouter,
  admin: adminRouter,
  media: mediaRouter,
  progress: progressRouter,
  donation: donationRouter,
});

export type AppRouter = typeof appRouter;
