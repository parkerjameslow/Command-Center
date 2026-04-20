"use client";

import { useStore, uid, today } from "@/lib/store";
import { applySettings, getSettings } from "@/lib/settings";
import { clearPinHash, lock } from "@/lib/pin";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function SettingsPage() {
  const { data, loaded, update } = useStore();
  const router = useRouter();
  const todayStr = today();
  const settings = useMemo(() => getSettings(data), [data]);
  const [displayName, setDisplayName] = useState(settings.displayName || "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement("input");
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function shareInvite() {
    const shareText = "Check out Command Center — a personal OS for becoming a better husband, father, friend, and human. One intentional day at a time.";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Command Center",
          text: shareText,
          url: appUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyInviteLink();
    }
  }

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  function toggleScripture() {
    const next = { ...settings, scriptureEnabled: !settings.scriptureEnabled };
    update((d) => applySettings(d, next, uid, todayStr));
  }

  function saveDisplayName() {
    const next = { ...settings, displayName: displayName.trim() || undefined };
    update((d) => applySettings(d, next, uid, todayStr));
  }

  function resetOnboarding() {
    const next = { ...settings, onboardingCompleted: false };
    update((d) => applySettings(d, next, uid, todayStr));
    router.push("/");
  }

  function lockNow() {
    lock();
    window.location.href = "/";
  }

  function resetPin() {
    clearPinHash();
    window.location.href = "/";
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Profile */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Profile</h2>
        <div>
          <label className="text-xs text-muted mb-1 block">Display name</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="What should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={saveDisplayName}
              className="px-3 py-2 bg-accent text-white rounded-lg text-xs font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Features</h2>
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-3">
            <div className="text-sm font-medium">Scripture of the Day</div>
            <div className="text-xs text-muted mt-0.5">
              LDS-focused daily scripture (KJV Bible + Book of Mormon + General Conference talk)
            </div>
          </div>
          <button
            onClick={toggleScripture}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              settings.scriptureEnabled ? "bg-accent" : "bg-card-border"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.scriptureEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Invite */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Share Command Center</h2>
          <p className="text-xs text-muted mt-1">
            Send the link to anyone. They&apos;ll set their own PIN and get their own private Command Center.
          </p>
        </div>

        <div className="bg-card-border/40 border border-card-border rounded-lg px-3 py-2 text-xs text-muted break-all font-mono">
          {appUrl}
        </div>

        <div className="flex gap-2">
          <button
            onClick={shareInvite}
            className="flex-1 py-2.5 bg-accent text-white rounded-lg text-xs font-medium"
          >
            Share invite
          </button>
          <button
            onClick={copyInviteLink}
            className="flex-1 py-2.5 bg-card border border-card-border rounded-lg text-xs font-medium text-muted"
          >
            {copied ? "✓ Copied" : "Copy link"}
          </button>
        </div>
      </section>

      {/* Onboarding */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Help</h2>
        <button
          onClick={resetOnboarding}
          className="w-full text-left text-sm hover:text-accent"
        >
          Replay the intro tour
        </button>
      </section>

      {/* Lock / Reset PIN */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Security</h2>
        <button
          onClick={lockNow}
          className="w-full text-left text-sm hover:text-accent"
        >
          Lock now
        </button>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full text-left text-sm text-danger hover:underline"
          >
            Reset PIN
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-muted">
              This will clear your PIN on this device. You&apos;ll set a new one next time you open the app.
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetPin}
                className="px-3 py-2 bg-danger text-white rounded-lg text-xs font-medium"
              >
                Yes, reset it
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-2 text-muted text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
