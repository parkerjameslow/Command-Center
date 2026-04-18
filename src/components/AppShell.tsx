"use client";

import { AuthProvider } from "./AuthProvider";
import { AuthGate } from "./AuthGate";
import { StoreProvider } from "@/lib/store";

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <StoreProvider>{children}</StoreProvider>;
  }

  return (
    <AuthProvider>
      <AuthGate>
        <StoreProvider>{children}</StoreProvider>
      </AuthGate>
    </AuthProvider>
  );
}
