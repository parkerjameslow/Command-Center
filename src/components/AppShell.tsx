"use client";

import { AuthProvider } from "./AuthProvider";
import { PinGate } from "./PinGate";
import { StoreProvider } from "@/lib/store";

const isSupabaseConfigured =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project");

export function AppShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <StoreProvider>{children}</StoreProvider>;
  }

  // AuthProvider manages the underlying Supabase session (anonymous or
  // legacy email). PinGate is the user-facing lock screen.
  return (
    <AuthProvider>
      <PinGate>
        <StoreProvider>{children}</StoreProvider>
      </PinGate>
    </AuthProvider>
  );
}
