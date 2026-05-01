import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type SessionPayload = {
  userId: string;
  username: string;
  onboardingCompleted: boolean;
  exp: number;
};

export const SESSION_COOKIE = "auron_session";

const encoder = new TextEncoder();

export async function signSession(payload: Omit<SessionPayload, "exp">) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14
  };
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = await hmac(body);
  return `${body}.${signature}`;
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if ((await hmac(body)) !== signature) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

async function hmac(value: string) {
  const secret = process.env.AUTH_SECRET || "auron-dev-secret-change-me";
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(Buffer.from(signature).toString("binary"));
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "binary").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}
