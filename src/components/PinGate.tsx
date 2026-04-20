"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  hashPin,
  storePinHash,
  getPinHash,
  markUnlocked,
  isUnlockedThisSession,
} from "@/lib/pin";

const PIN_LENGTH = 4;

type Phase = "loading" | "setup" | "confirm" | "unlock" | "unlocked";

export function PinGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Decide which phase to show
  useEffect(() => {
    if (authLoading) return;

    const hash = getPinHash();

    // Already unlocked this browser session? just proceed
    if (hash && isUnlockedThisSession()) {
      setPhase("unlocked");
      return;
    }

    if (hash) {
      // PIN is set, need to unlock
      setPhase("unlock");
    } else {
      // First run — need to set a PIN. Ensure there's a Supabase user first.
      if (!user) {
        // Kick off anonymous auth in the background
        setBusy(true);
        supabase.auth.signInAnonymously().then(({ error }) => {
          setBusy(false);
          if (error) {
            // Anonymous auth isn't enabled — still let them set a PIN, they
            // just won't have cloud sync until we fall back to local-only.
            console.warn("Anonymous auth unavailable:", error.message);
          }
        });
      }
      setPhase("setup");
    }
  }, [authLoading, user]);

  // When PIN reaches full length, validate
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;

    if (phase === "setup") {
      // First entry — save and move to confirm
      setFirstPin(pin);
      setPin("");
      setPhase("confirm");
      return;
    }

    if (phase === "confirm") {
      if (pin !== firstPin) {
        setError("PINs didn't match. Try again.");
        setPin("");
        setFirstPin("");
        setPhase("setup");
        return;
      }
      // Match! Hash and store.
      hashPin(pin).then((hash) => {
        storePinHash(hash);
        markUnlocked();
        setPin("");
        setFirstPin("");
        setError("");
        setPhase("unlocked");
      });
      return;
    }

    if (phase === "unlock") {
      const stored = getPinHash();
      if (!stored) {
        setPhase("setup");
        return;
      }
      hashPin(pin).then((hash) => {
        if (hash === stored) {
          markUnlocked();
          setPin("");
          setError("");
          setPhase("unlocked");
        } else {
          setError("Wrong PIN. Try again.");
          setPin("");
        }
      });
    }
  }, [pin, phase, firstPin]);

  if (phase === "loading" || authLoading || busy) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (phase === "unlocked") {
    return <>{children}</>;
  }

  const title =
    phase === "setup"
      ? "Set a 4-digit PIN"
      : phase === "confirm"
      ? "Confirm your PIN"
      : "Enter your PIN";

  const subtitle =
    phase === "setup"
      ? "This will unlock Command Center on this device."
      : phase === "confirm"
      ? "Enter the same PIN again."
      : "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6 py-10">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Command Center</h1>
          <div className="text-sm text-muted">{title}</div>
          {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 ${
                i < pin.length ? "bg-accent border-accent" : "border-muted"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        <div className="min-h-[20px] text-xs text-danger">{error}</div>

        {/* Number pad */}
        <NumberPad
          onDigit={(d) => {
            if (pin.length < PIN_LENGTH) {
              setError("");
              setPin(pin + d);
            }
          }}
          onBackspace={() => setPin(pin.slice(0, -1))}
        />
      </div>
    </div>
  );
}

function NumberPad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: string) => void;
  onBackspace: () => void;
}) {
  const rows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {rows.flat().map((d) => (
        <PadButton key={d} onClick={() => onDigit(d)}>
          {d}
        </PadButton>
      ))}
      <div />
      <PadButton onClick={() => onDigit("0")}>0</PadButton>
      <PadButton onClick={onBackspace} small>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <line x1="18" y1="9" x2="12" y2="15" />
          <line x1="12" y1="9" x2="18" y2="15" />
        </svg>
      </PadButton>
    </div>
  );
}

function PadButton({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-full bg-card border border-card-border flex items-center justify-center active:bg-card-border transition-colors ${
        small ? "text-muted" : "text-2xl font-light"
      }`}
    >
      {children}
    </button>
  );
}
