import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import * as jose from "jose";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { env } from "./lib/env";

const scrypt = promisify(scryptCallback);
const secret = new TextEncoder().encode(env.sessionSecret);

export type ParentSession = { type: "parent"; userId: number; role: "admin" | "parent" };
export type ChildSession = { type: "child"; childId: number; parentId: number };

export async function hashSecret(value: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(value, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifySecret(value: string, stored: string) {
  const [algorithm, salt, digest] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !digest) return false;
  const actual = (await scrypt(value, salt, 64)) as Buffer;
  const expected = Buffer.from(digest, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function sign(claim: ParentSession | ChildSession) {
  return new jose.SignJWT(claim).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret);
}

export async function createParentToken(userId: number, role: ParentSession["role"]) {
  return sign({ type: "parent", userId, role });
}
export async function createChildToken(childId: number, parentId: number) {
  return sign({ type: "child", childId, parentId });
}

async function verify<T>(token?: string): Promise<T | undefined> {
  if (!token) return undefined;
  try { return (await jose.jwtVerify(token, secret, { algorithms: ["HS256"] })).payload as T; }
  catch { return undefined; }
}
export async function readSessions(headers: Headers) {
  const parsed = cookie.parse(headers.get("cookie") ?? "");
  return { parent: await verify<ParentSession>(parsed[Session.cookieName]), child: await verify<ChildSession>(parsed[Session.childCookieName]) };
}
