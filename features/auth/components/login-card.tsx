"use client";

import React, { useEffect, useState } from "react";
import { Boxes, CircleAlert, QrCode, UserCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// App-specific copy. content-planner's login card uses the same layout with its own copy.
const COPY = {
  app: "Assets Management",
  headline: "Every company asset, accounted for.",
  intro: "Track devices, who holds them, and their service history in one place.",
  highlights: [
    { icon: Boxes, title: "Inventory", text: "Every device with its tag, condition and location." },
    { icon: UserCheck, title: "Custody", text: "Who has what, since when, and when it's due back." },
    { icon: QrCode, title: "QR labels", text: "Print a label, scan it, open the record." },
  ],
};

const ERROR_MESSAGES: Record<string, string> = {
  "not-member": "This Google account isn't on the team yet. Ask an admin to add you.",
  unverified: "Your Google account's email isn't verified.",
  state: "That sign-in link expired. Please try again.",
  session: "Your session ended. Please sign in again.",
  failed: "Sign-in failed. Please try again.",
};

export function LoginCard({ error }: { error?: string }) {
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.failed) : null;

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      {/* Sign-in: the whole screen on phones and tablets, the left column on desktop. */}
      <section className="flex min-h-dvh flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10">
        {/* my-auto centers vertically; min-h (not h) lets short screens scroll instead of clipping. */}
        <div className="mx-auto my-auto w-full max-w-sm space-y-8 py-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small SVG gains nothing from next/image */}
          <img src="/assets/logo-landscape.svg" alt="SCC Group" className="h-10 w-auto" />

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to {COPY.app} with your work Google account.</p>
          </div>

          <div className="space-y-4">
            {message && (
              <div role="alert" className="flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            <GoogleButton />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Access is by invitation. Ask your admin to add your Google account.
            </p>
          </div>
        </div>

        <footer className="mx-auto w-full max-w-sm text-xs text-muted-foreground">© {new Date().getFullYear()} SCC Group</footer>
      </section>

      {/* Brand panel: desktop only, so phones get straight to the button. */}
      <aside className="relative hidden overflow-hidden border-l bg-primary/5 lg:flex lg:items-center lg:p-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(color-mix(in_oklch,var(--primary)_22%,transparent)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div className="relative max-w-md space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground">{COPY.headline}</h2>
            <p className="text-base text-muted-foreground">{COPY.intro}</p>
          </div>
          <ul className="space-y-6">
            {COPY.highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-background text-primary shadow-xs">
                  <Icon className="size-5" />
                </span>
                <span className="space-y-0.5 pt-0.5">
                  <span className="block text-sm font-semibold text-foreground">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}

/** Google's standard sign-in button (light and dark variants from Google's branding guidelines). */
function GoogleButton() {
  const [redirecting, setRedirecting] = useState(false);

  // Coming back with the browser's Back button restores the page as it was; make the button usable again.
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setRedirecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <a
      href="/api/auth/google"
      aria-disabled={redirecting}
      onClick={(e) => {
        if (redirecting) e.preventDefault();
        else setRedirecting(true);
      }}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2.5 rounded-md border px-3 text-sm font-medium outline-none transition-colors lg:h-10",
        "border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#F8F9FA]",
        "dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F1F21]",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        redirecting && "pointer-events-none opacity-70"
      )}
    >
      {redirecting ? <Spinner /> : <GoogleLogo />}
      {redirecting ? "Redirecting to Google…" : "Continue with Google"}
    </a>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="size-4.5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
