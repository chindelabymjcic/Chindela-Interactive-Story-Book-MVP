import { z } from "zod";
import { createRouter, authedQuery, childQuery } from "./middleware";
import {
  findDiaryEntriesByChild,
  createDiaryEntry,
  findAIFeedbackByChild,
  findUndeliveredFeedback,
  createAIFeedback,
  markFeedbackAsDelivered,
} from "./queries/diary";
import { incrementChildStats } from "./queries/children";
import { createNotification } from "./queries/notifications";
import { generateTutorFeedback } from "./lib/gemini";

export const diaryRouter = createRouter({
  childEntries: childQuery.query(async ({ ctx }) => findDiaryEntriesByChild(ctx.child.id)),
  list: authedQuery
    .input(z.object({ childId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verify the child belongs to the parent
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return findDiaryEntriesByChild(input.childId);
    }),

  create: childQuery
    .input(
      z.object({
        childId: z.number(),
        storyId: z.number().optional(),
        lessonId: z.number().optional(),
        textContent: z.string().trim().min(1).max(4_000),
        audioUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        mood: z.enum(["happy", "excited", "calm", "loved", "sad"]).optional(),
        entryDate: z.string().datetime(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.id !== ctx.child.id) throw new Error("Unauthorized");

      const entry = await createDiaryEntry({
        childId: input.childId,
        storyId: input.storyId,
        lessonId: input.lessonId,
        textContent: input.textContent,
        audioUrl: input.audioUrl,
        imageUrl: input.imageUrl,
        mood: input.mood,
        entryDate: new Date(input.entryDate),
      });

      // Increment child stats
      await incrementChildStats(input.childId);

      // Generate AI feedback
      const feedback = await generateTutorFeedback(
        input.textContent,
        child.name,
        child.favoriteCharacter || "Chindela"
      );

      await createAIFeedback({
        entryId: entry!.id,
        childId: input.childId,
        positiveFeedback: feedback.positiveFeedback,
        reflectionGuidance: feedback.reflectionGuidance,
        encouragement: feedback.encouragement,
        safeSuggestions: feedback.safeSuggestions,
        characterName: feedback.characterName,
      });

      // Create notification for parent
      await createNotification({
        userId: child.parentId,
        childId: input.childId,
        type: "diary_entry",
        title: `${child.name} submitted a new diary entry!`,
        message: input.textContent
          ? `"${input.textContent.substring(0, 100)}..."`
          : "A new diary entry has been submitted.",
        relatedId: entry!.id,
      });

      return entry;
    }),

  // AI Feedback
  feedback: authedQuery
    .input(z.object({ childId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { findChildById } = await import("./queries/children");
      const child = await findChildById(input.childId);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return findAIFeedbackByChild(input.childId);
    }),

  undeliveredFeedback: childQuery
    .input(z.object({ childId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (input.childId !== ctx.child.id) throw new Error("Unauthorized");
      return findUndeliveredFeedback(input.childId);
    }),

  markFeedbackDelivered: childQuery
    .input(z.object({ feedbackId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const feedback = await findUndeliveredFeedback(ctx.child.id);
      if (!feedback.some((item) => item.id === input.feedbackId)) throw new Error("Unauthorized");
      await markFeedbackAsDelivered(input.feedbackId);
      return { success: true };
    }),
});
