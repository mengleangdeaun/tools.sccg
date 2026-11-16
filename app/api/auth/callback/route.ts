import { NextRequest, NextResponse } from "next/server";
import { findActiveMember } from "@/lib/auth/dal";
import { OAUTH_STATE_COOKIE, appOrigin, createOAuthClient } from "@/lib/auth/google";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { recordLogin } from "@/lib/team-store";

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const fail = (reason: string) => {
    const response = NextResponse.redirect(`${origin}/login?error=${reason}`);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  };

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) return fail("state");

  try {
    const client = createOAuthClient(req);
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) return fail("failed");
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) return fail("unverified");

    const member = await findActiveMember(profile.email);
    if (!member) return fail("not-member");

    const token = await createSessionToken(member.email);
    // A failed login timestamp must not block the sign-in, including errors thrown before the promise exists.
    try {
      await recordLogin(member, profile.name, profile.picture);
    } catch (error) {
      console.error("Could not record login:", error);
    }

    const response = NextResponse.redirect(`${origin}/`);
    response.cookies.set(SESSION_COOKIE, token, { ...sessionCookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return fail("failed");
  }
}
