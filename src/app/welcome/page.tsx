"use client";

import { useStore, uid, today } from "@/lib/store";
import { applySettings, getSettings } from "@/lib/settings";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { data, loaded, update } = useStore();
  const router = useRouter();

  function getStarted() {
    const settings = getSettings(data);
    update((d) => applySettings(d, { ...settings, welcomeSeen: true }, uid, today()));
    router.push("/");
  }

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to Command Center</h1>
        <p className="text-sm text-muted leading-relaxed">
          Your personal operating system for becoming a better husband, father,
          friend, and human — one intentional day at a time.
        </p>
      </div>

      <section className="space-y-4">
        <Feature
          title="Daily check-ins"
          body="Three short surveys — morning, midday, evening — that set your intention, catch you mid-stride, and help you reflect. They feed everything else."
        />
        <Feature
          title="Your proactive brain"
          body="10+ nudges rotating throughout the day. Specific, contextual actions based on your data, not generic reminders. Tap one to log it as done."
        />
        <Feature
          title="Top 3 per domain"
          body="Personal, Family, Chores, Growth — each gets 3 high-impact suggestions per day. Fresh set tomorrow."
        />
        <Feature
          title="People that matter"
          body="Add your wife, kids, parents, close friends. The app quietly tracks how long it's been and suggests specific ways to reconnect."
        />
        <Feature
          title="Everyday Events"
          body="Water. Exercise. Sleep. Wake. Plus daily essentials tailored to you. Track your streak across weeks and months."
        />
        <Feature
          title="Your growth story"
          body="Every nudge you complete, every reflection you write, flows into a journal you can look back on. The app learns and adapts."
        />
      </section>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm text-muted leading-relaxed">
        <div className="font-semibold text-foreground mb-1">A few things to know</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Your data is private — only you can see it on your device.</li>
          <li>One PIN, one device, no account to remember.</li>
          <li>You&apos;ll get a short tour after this, then you&apos;re set.</li>
        </ul>
      </div>

      <button
        onClick={getStarted}
        className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
      >
        Get started
      </button>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}
