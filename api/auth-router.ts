import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery, childQuery } from "./middleware";
import { z } from "zod";
import { createUser, findUserByEmail, updateLastSignIn } from "./queries/users";
import { findChildForLogin } from "./queries/children";
import { createChildToken, createParentToken, hashSecret, verifySecret } from "./auth";
import { env } from "./lib/env";

const credentials = z.object({ email: z.string().email().max(320), password: z.string().min(12).max(128) });

function setSession(headers: Headers, name: string, token: string, requestHeaders: Headers) {
  const opts = getSessionCookieOptions(requestHeaders);
  headers.append("set-cookie", cookie.serialize(name, token, { httpOnly: true, path: "/", sameSite: opts.sameSite?.toLowerCase() as "lax" | "none", secure: opts.secure, maxAge: Session.maxAgeMs / 1000 }));
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  childMe: childQuery.query(async ({ ctx }) => {
    const child = await findChildForLogin(ctx.child.id);
    if (!child || child.parentId !== ctx.child.parentId) throw new Error("Child account unavailable.");
    return { id: child.id, name: child.name, ageGroupId: child.ageGroupId, totalEntries: child.totalEntries, streakDays: child.streakDays };
  }),
  register: publicQuery.input(credentials.extend({ name: z.string().trim().min(1).max(255) })).mutation(async ({ input, ctx }) => {
    const email = input.email.toLowerCase();
    if (await findUserByEmail(email)) throw new Error("An account with that email already exists.");
    const role = env.adminEmail && env.adminEmail === email ? "admin" : "parent";
    const user = await createUser({ name: input.name, email, passwordHash: await hashSecret(input.password), role });
    if (!user) throw new Error("Unable to create account.");
    setSession(ctx.resHeaders, Session.cookieName, await createParentToken(user.id, role), ctx.req.headers);
    return user;
  }),
  login: publicQuery.input(credentials).mutation(async ({ input, ctx }) => {
    const user = await findUserByEmail(input.email.toLowerCase());
    if (!user || !(await verifySecret(input.password, user.passwordHash))) throw new Error("Invalid email or password.");
    await updateLastSignIn(user.id);
    setSession(ctx.resHeaders, Session.cookieName, await createParentToken(user.id, user.role), ctx.req.headers);
    return user;
  }),
  childLogin: publicQuery.input(z.object({ childId: z.number().int().positive(), pin: z.string().regex(/^\d{4,8}$/) })).mutation(async ({ input, ctx }) => {
    const child = await findChildForLogin(input.childId);
    if (!child || !(await verifySecret(input.pin, child.pinHash))) throw new Error("Invalid child ID or PIN.");
    setSession(ctx.resHeaders, Session.childCookieName, await createChildToken(child.id, child.parentId), ctx.req.headers);
    return { id: child.id, name: child.name, ageGroupId: child.ageGroupId };
  }),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
  childLogout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append("set-cookie", cookie.serialize(Session.childCookieName, "", { httpOnly: true, path: "/", sameSite: opts.sameSite?.toLowerCase() as "lax" | "none", secure: opts.secure, maxAge: 0 }));
    return { success: true };
  }),
});
