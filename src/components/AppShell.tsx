"use client";

import { AuthProvider } from "./AuthProvider";
import { StoreProvider } from "@/lib/store";

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <StoreProvider>{children}</StoreProvider>;
  }

  // AuthProvider keeps the Supabase session alive and auto-refreshes tokens.
  // No AuthGate — the app is accessible without a login screen.
  return (
    <AuthProvider>
      <StoreProvider>{children}</StoreProvider>
    </AuthProvider>
  );
}
