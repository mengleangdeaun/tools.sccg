import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "./lib/auth/session";

// Cookie check only, as the Next docs advise. Real permission checks are in each route handler.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/api/auth/")) return NextResponse.next();

  if (await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|woff2)$).*)"],
};
