import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, createOAuthClient } from "@/lib/auth/google";
import { sessionCookieOptions } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const state = randomBytes(32).toString("hex");
  const url = createOAuthClient(req).generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, state, { ...sessionCookieOptions, maxAge: 600 });
  return response;
}
