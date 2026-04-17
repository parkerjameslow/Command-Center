"use client";

import { AuthProvider } from "./AuthProvider";
import { AuthGate } from "./AuthGate";

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    // No Supabase — run in local-only mode
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
