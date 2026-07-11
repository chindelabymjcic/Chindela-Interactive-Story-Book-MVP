import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import {
  findChildrenByParentId,
  findChildById,
  createChild,
  updateChild,
  deleteChild,
} from "./queries/children";
import { hashSecret } from "./auth";

export const childRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    return findChildrenByParentId(ctx.user.id);
  }),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const child = await findChildById(input.id);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Child not found");
      }
      return child;
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        pin: z.string().length(4),
        ageGroupId: z.number(),
        age: z.number().min(3).max(99),
        avatar: z.string().optional(),
        favoriteCharacter: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return createChild({
        ...input,
        pinHash: await hashSecret(input.pin),
        parentId: ctx.user.id,
      });
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        pin: z.string().length(4).optional(),
        ageGroupId: z.number().optional(),
        age: z.number().min(3).max(99).optional(),
        avatar: z.string().optional(),
        favoriteCharacter: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, pin, ...data } = input;
      const child = await findChildById(id);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Child not found");
      }
      return updateChild(id, { ...data, ...(pin ? { pinHash: await hashSecret(pin) } : {}) });
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const child = await findChildById(input.id);
      if (!child || child.parentId !== ctx.user.id) {
        throw new Error("Child not found");
      }
      await deleteChild(input.id);
      return { success: true };
    }),

  // Admin: list all children
  adminList: adminQuery.query(async () => {
    // For admin, we'd need a query to get all children
    // This is a simplified version
    return { message: "Use a direct DB query for all children" };
  }),
});
