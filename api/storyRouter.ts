import { z } from "zod";
import { createRouter, adminQuery, contentQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { hasActiveEntitlement } from "./queries/subscriptions";
import { findChildById, findChildrenByParentId } from "./queries/children";
import {
  findAllStories,
  findStoriesByAgeGroup,
  findStoryById,
  createStory,
  updateStory,
  deleteStory,
  findLessonsByStory,
  findLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from "./queries/stories";

export const storyRouter = createRouter({
  // Public
  list: contentQuery.query(async ({ ctx }) => {
    const stories = await findAllStories();
    if (ctx.user?.role === "admin") return stories;
    if (ctx.child) {
      const child = await findChildById(ctx.child.id);
      if (!child || !child.isActive || !(await hasActiveEntitlement(child.id, child.ageGroupId))) return [];
      return stories.filter((story) => story.ageGroupId === child.ageGroupId && story.isActive && !story.isArchived);
    }
    const children = await findChildrenByParentId(ctx.user!.id);
    const allowed = new Set<number>();
    for (const child of children) if (child.isActive && await hasActiveEntitlement(child.id, child.ageGroupId)) allowed.add(child.ageGroupId);
    return stories.filter((story) => allowed.has(story.ageGroupId) && story.isActive && !story.isArchived);
  }),

  byAgeGroup: contentQuery
    .input(z.object({ ageGroupId: z.number() }))
    .query(async ({ input, ctx }) => {
      await requireEntitlement(ctx, input.ageGroupId);
      return findStoriesByAgeGroup(input.ageGroupId);
    }),

  byId: contentQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const story = await findStoryById(input.id);
      if (!story) return undefined;
      await requireEntitlement(ctx, story.ageGroupId);
      return story;
    }),

  // Lessons
  lessons: contentQuery
    .input(z.object({ storyId: z.number() }))
    .query(async ({ input, ctx }) => {
      const story = await findStoryById(input.storyId);
      if (!story) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
      await requireEntitlement(ctx, story.ageGroupId);
      return findLessonsByStory(input.storyId);
    }),

  lessonById: contentQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const lesson = await findLessonById(input.id);
      if (!lesson) return undefined;
      const story = await findStoryById(lesson.storyId);
      if (!story) throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
      await requireEntitlement(ctx, story.ageGroupId);
      return lesson;
    }),

  // Admin CRUD
  create: adminQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        ageGroupId: z.number(),
        contentYearId: z.number(),
        characterId: z.number().optional(),
        dayNumber: z.number().min(1).max(365),
        coverImage: z.string().optional(),
        theme: z.string().optional(),
        moralLesson: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createStory({
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        ageGroupId: z.number().optional(),
        contentYearId: z.number().optional(),
        characterId: z.number().optional(),
        dayNumber: z.number().min(1).max(365).optional(),
        coverImage: z.string().optional(),
        theme: z.string().optional(),
        moralLesson: z.string().optional(),
        isActive: z.boolean().optional(),
        isArchived: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateStory(id, data);
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteStory(input.id);
      return { success: true };
    }),

  // Lesson CRUD
  createLesson: adminQuery
    .input(
      z.object({
        storyId: z.number(),
        title: z.string().min(1),
        content: z.string().min(1),
        pageNumber: z.number().min(1),
        imageUrl: z.string().optional(),
        audioUrl: z.string().optional(),
        characterDialogue: z.string().optional(),
        interactiveElement: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createLesson(input);
    }),

  updateLesson: adminQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        pageNumber: z.number().optional(),
        imageUrl: z.string().optional(),
        audioUrl: z.string().optional(),
        characterDialogue: z.string().optional(),
        interactiveElement: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return updateLesson(id, data);
    }),

  deleteLesson: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteLesson(input.id);
      return { success: true };
    }),
});

async function requireEntitlement(
  ctx: { user?: { id: number; role: "admin" | "parent" }; child?: { id: number } },
  ageGroupId: number,
) {
  if (ctx.user?.role === "admin") return;
  if (ctx.child) {
    const child = await findChildById(ctx.child.id);
    if (child?.isActive && child.ageGroupId === ageGroupId && await hasActiveEntitlement(child.id, ageGroupId)) return;
  }
  if (ctx.user) {
    const children = await findChildrenByParentId(ctx.user.id);
    const entitlements = await Promise.all(children.filter((child) => child.isActive && child.ageGroupId === ageGroupId).map((child) => hasActiveEntitlement(child.id, ageGroupId)));
    if (entitlements.some(Boolean)) return;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "An active subscription for this age group is required." });
}
