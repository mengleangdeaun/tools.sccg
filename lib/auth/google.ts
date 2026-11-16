import { google } from "googleapis";
import { NextRequest } from "next/server";

export const OAUTH_STATE_COOKIE = "oauth_state";

// Set APP_URL in production: behind a reverse proxy the request origin can be an internal address.
export function appOrigin(req: NextRequest): string {
  return process.env.APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}

export function createOAuthClient(req: NextRequest) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appOrigin(req)}/api/auth/callback`
  );
}
