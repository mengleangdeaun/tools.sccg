import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const MIN_SECRET_LENGTH = 32;
const encodeKey = (secret: string) => new TextEncoder().encode(secret);

export async function createSessionToken(
  email: string,
  secret = process.env.AUTH_SECRET ?? ""
): Promise<string> {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error("AUTH_SECRET must be set in .env and be at least 32 characters.");
  }
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodeKey(secret));
}

export async function readSessionToken(
  token: string | undefined,
  secret = process.env.AUTH_SECRET ?? ""
): Promise<string | null> {
  if (!token || secret.length < MIN_SECRET_LENGTH) return null;
  try {
    const { payload } = await jwtVerify(token, encodeKey(secret), { algorithms: ["HS256"] });
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

