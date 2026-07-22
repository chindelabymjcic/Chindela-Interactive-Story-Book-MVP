import { z } from "zod";
import { createRouter, authedQuery, childQuery } from "./middleware";
import {
  findDiaryEntriesByChild,
  findDiaryEntryById,
  createDiaryEntry,
  findAIFeedbackByChild,
  findAIFeedbackByEntry,
  findLatestAttemptNumber,
  findUndeliveredFeedback,
  createAIFeedback,
  markFeedbackAsDelivered,
} from "./queries/diary";
import { incrementChildStats } from "./queries/children";
import { createNotification } from "./queries/notifications";
import { generateTutorFeedback, fetchMediaAsBase64, guessMimeTypeFromUrl, type PriorAttempt } from "./lib/gemini";
import { isOwnStorageUrl } from "./lib/storage";

async function generateAndStoreFeedback(params: {
  entryId: number;
  childId: number;
  childName: string;
  characterName: string;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
}) {
  const priorRows = await findAIFeedbackByEntry(params.entryId);
  const previousAttempts: PriorAttempt[] = priorRows.map((f) => ({
    attemptNumber: f.attemptNumber,
    submittedText: f.submittedText,
    reflectionGuidance: f.reflectionGuidance,
    hints: f.hints,
  }));
  const attemptNumber = (await findLatestAttemptNumber(params.entryId)) + 1;

  const media = [];
  for (const url of [params.imageUrl, params.audioUrl]) {
    // Never let a child/parent-supplied URL make the server fetch arbitrary
    // attacker-chosen hosts (SSRF) -- only ever fetch from our own S3 bucket,
    // which is all that "attach a photo/recording to your diary entry" needs.
    if (!url || !isOwnStorageUrl(url)) continue;
    const mimeType = guessMimeTypeFromUrl(url);
    if (!mimeType) continue;
    const encoded = await fetchMediaAsBase64(url, mimeType);
    if (encoded) media.push(encoded);
  }

  const feedback = await generateTutorFeedback({
    entryText: params.text,
    childName: params.childName,
    characterName: params.characterName,
    previousAttempts,
    media,
  });

  return createAIFeedback({
    entryId: params.entryId,
    childId: params.childId,
    attemptNumber,
    submittedText: params.text,
    positiveFeedback: feedback.positiveFeedback,
    mistakesExplained: feedback.mistakesExplained,
    hints: feedback.hints,
    reflectionGuidance: feedback.reflectionGuidance,
    encouragement: feedback.encouragement,
    safeSuggestions: feedback.safeSuggestions,
    characterName: feedback.characterName,
  });
}

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

      // Increment child stats (total entries + daily streak)
      await incrementChildStats(input.childId, new Date(input.entryDate));

      // The diary entry is already saved at this point -- a Gemini outage (rate
      // limit, transient network error, etc.) must never fail the child's
      // submission itself. The child-facing UI already treats feedback as a
      // separate, best-effort step (see ChildDiary.tsx's entryFeedback query).
      try {
        await generateAndStoreFeedback({
          entryId: entry!.id,
          childId: input.childId,
          childName: child.name,
          characterName: child.favoriteCharacter || "Chindela",
          text: input.textContent,
          imageUrl: input.imageUrl,
          audioUrl: input.audioUrl,
        });
      } catch (err) {
        console.error("[diary] AI feedback generation failed for entry", entry!.id, err);
      }

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

  // Revise and resubmit an existing entry for another round of tutor feedback.
  // Tracks every attempt so the tutor (and the parent) can see improvement over time.
  resubmit: childQuery
    .input(
      z.object({
        entryId: z.number(),
        textContent: z.string().trim().min(1).max(4_000),
        imageUrl: z.string().optional(),
        audioUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const entry = await findDiaryEntryById(input.entryId);
      if (!entry || entry.childId !== ctx.child.id) throw new Error("Unauthorized");

      const { findChildById } = await import("./queries/children");
      const child = await findChildById(ctx.child.id);
      if (!child) throw new Error("Unauthorized");

      const { updateDiaryEntryContent } = await import("./queries/diary");
      await updateDiaryEntryContent(input.entryId, {
        textContent: input.textContent,
        imageUrl: input.imageUrl ?? entry.imageUrl ?? undefined,
        audioUrl: input.audioUrl ?? entry.audioUrl ?? undefined,
      });

      // The revised entry text is already saved at this point (see
      // updateDiaryEntryContent above) -- a Gemini outage must never block that
      // save from succeeding, even though this endpoint's main purpose is to
      // produce new feedback.
      try {
        return await generateAndStoreFeedback({
          entryId: input.entryId,
          childId: ctx.child.id,
          childName: child.name,
          characterName: child.favoriteCharacter || "Chindela",
          text: input.textContent,
          imageUrl: input.imageUrl ?? entry.imageUrl ?? undefined,
          audioUrl: input.audioUrl ?? entry.audioUrl ?? undefined,
        });
      } catch (err) {
        console.error("[diary] AI feedback generation failed on resubmit for entry", input.entryId, err);
        return null;
      }
    }),

  // Full attempt/conversation history for one entry (child's own, or their parent's).
  entryFeedback: childQuery
    .input(z.object({ entryId: z.number() }))
    .query(async ({ input, ctx }) => {
      const entry = await findDiaryEntryById(input.entryId);
      if (!entry || entry.childId !== ctx.child.id) throw new Error("Unauthorized");
      return findAIFeedbackByEntry(input.entryId);
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
