import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/daily-quest", "/side-quests", "/weekly", "/monthly", "/overview", "/audit", "/settings", "/diary", "/social", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get("auron_session")?.value);

  if (session && PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = session.onboardingCompleted ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!PROTECTED_PREFIXES.some((path) => pathname.startsWith(path))) return NextResponse.next();

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.onboardingCompleted && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"]
};

type SessionPayload = {
  userId: string;
  username: string;
  onboardingCompleted: boolean;
  exp: number;
};

async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if ((await hmac(body)) !== signature) return null;
  try {
    const payload = JSON.parse(atob(base64UrlToBase64(body))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hmac(value: string) {
  const secret = process.env.AUTH_SECRET || "auron-dev-secret-change-me";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const bytes = String.fromCharCode(...new Uint8Array(signature));
  return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBase64(value: string) {
  return value.replace(/-/g, "+").replace(/_/g, "/");
}
