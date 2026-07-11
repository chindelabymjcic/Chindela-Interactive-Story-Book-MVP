import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertChild } from "@db/schema";
import { getDb } from "./connection";

export async function findChildrenByParentId(parentId: number) {
  return getDb().query.children.findMany({
    where: eq(schema.children.parentId, parentId),
    with: {
      ageGroup: true,
    },
  });
}

export async function findChildById(id: number) {
  return getDb().query.children.findFirst({
    where: eq(schema.children.id, id),
    with: {
      ageGroup: true,
      parent: true,
    },
  });
}

export async function findChildForLogin(id: number) {
  return getDb().query.children.findFirst({
    where: and(eq(schema.children.id, id), eq(schema.children.isActive, true)),
    with: {
      ageGroup: true,
    },
  });
}

export async function createChild(data: InsertChild) {
  const [result] = await getDb()
    .insert(schema.children)
    .values(data)
    .$returningId();
  return findChildById(result.id);
}

export async function updateChild(id: number, data: Partial<InsertChild>) {
  await getDb()
    .update(schema.children)
    .set(data)
    .where(eq(schema.children.id, id));
  return findChildById(id);
}

export async function deleteChild(id: number) {
  await getDb()
    .update(schema.children)
    .set({ isActive: false })
    .where(eq(schema.children.id, id));
}

export async function incrementChildStats(childId: number) {
  const child = await findChildById(childId);
  if (!child) return null;
  return updateChild(childId, {
    totalEntries: (child.totalEntries || 0) + 1,
  });
}
