import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findActiveMember } from "@/lib/auth/dal";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { LoginCard } from "@/features/auth/components/login-card";

// The root layout's title template adds " · Assets Management".
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Already signed in as an active member: go straight to the app. A cookie alone is not enough,
  // or a deactivated member would bounce between here and the app forever.
  const email = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (email && (await findActiveMember(email))) redirect("/");

  const { error } = await searchParams;
  return <LoginCard error={error} />;
}
