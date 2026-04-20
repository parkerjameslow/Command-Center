// Device-local PIN helpers. The PIN never leaves the device — it just
// gates access to an already-authenticated Supabase session. SHA-256 via
// the Web Crypto API.

const STORAGE_KEY = "cc-pin-hash";
const SESSION_KEY = "cc-pin-unlocked";

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode("cc-v1:" + pin));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function storePinHash(hash: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, hash);
}

export function getPinHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function clearPinHash(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function markUnlocked(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function isUnlockedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function lock(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
