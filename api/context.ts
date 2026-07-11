import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { readSessions } from "./auth";
import { findUserById } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  child?: { id: number; parentId: number };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  const sessions = await readSessions(opts.req.headers);
  if (sessions.parent?.type === "parent") ctx.user = await findUserById(sessions.parent.userId);
  if (sessions.child?.type === "child") ctx.child = { id: sessions.child.childId, parentId: sessions.child.parentId };
  return ctx;
}
