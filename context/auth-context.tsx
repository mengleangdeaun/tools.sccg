"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Member, Permission, hasPermission } from "@/lib/auth/permissions";

interface AuthContextValue {
  currentUser: Member | null;
  loading: boolean;
  can: (permission: Permission) => boolean;
  updateProfile: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.member) setCurrentUser(data.member);
        else window.location.href = "/login?error=session";
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const can = (permission: Permission): boolean => {
    return hasPermission(currentUser, permission);
  };

  // Saves your own name and swaps in the server's fresh copy of you, so the sidebar updates at once.
  const updateProfile = useCallback(async (name: string) => {
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not update your name.");
    if (data.member) setCurrentUser(data.member);
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, can, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

