"use client";

import { useState } from "react";
import { useStore, uid, today } from "@/lib/store";
import { applySettings, getSettings, isNewUser } from "@/lib/settings";

interface Step {
  title: string;
  body: string;
  cta?: string;
}

const STEPS: Step[] = [
  {
    title: "Welcome to your Command Center",
    body: "This is your personal operating system for becoming a better husband, father, friend, and human — one intentional day at a time.",
  },
  {
    title: "Start with the people who matter",
    body: "Add your wife, kids, parents, close friends. The app will quietly remind you when it's been too long — and suggest specific ways to reconnect based on your patterns.",
    cta: "Got it",
  },
  {
    title: "Three daily check-ins",
    body: "Morning sets your intention. Midday helps you refocus. Evening reflects on the day. Each one is 2–5 questions that feed the app's suggestions throughout the day.",
  },
  {
    title: "Nudges — your proactive brain",
    body: "Throughout the day you'll see 10+ nudges rotating in and out — real, specific actions tailored to your week. Tap one, mark it done, and it becomes part of your journal.",
  },
  {
    title: "Top 3 per area, every day",
    body: "Personal, Family, Chores, Growth — each has 3 high-impact suggestions per day based on what you're neglecting. Fresh set tomorrow.",
  },
  {
    title: "Everyday Events",
    body: "Your core daily goals: water, exercise, sleep, wake. Plus suggestions tailored to your data. Track your streak across the week and month.",
  },
  {
    title: "Journal — your growth story",
    body: "Every nudge you complete, every check-in, every connection log is saved to your journal. Look back and see who you're becoming.",
  },
  {
    title: "You're ready.",
    body: "Start by adding one person to My People, then do your first morning check-in. The app gets smarter the more data you give it.",
    cta: "Let's go",
  },
];

export function OnboardingTour() {
  const { data, loaded, update } = useStore();
  const [step, setStep] = useState(0);

  if (!loaded) return null;

  const settings = getSettings(data);
  if (settings.onboardingCompleted) return null;
  // Existing users with data don't need the tour — treat them as completed
  if (!isNewUser(data)) return null;

  function finish() {
    const next = { ...getSettings(data), onboardingCompleted: true };
    update((d) => applySettings(d, next, uid, today()));
  }

  function skip() {
    finish();
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center px-4">
      <div className="bg-background w-full max-w-sm rounded-2xl p-6 space-y-5">
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-card-border"}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-3 min-h-[140px]">
          <h2 className="text-xl font-bold">{current.title}</h2>
          <p className="text-sm leading-relaxed text-muted">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={skip}
            className="text-xs text-muted hover:text-foreground"
          >
            Skip tour
          </button>
          <button
            onClick={next}
            className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium"
          >
            {current.cta || (isLast ? "Let's go" : "Next")}
          </button>
        </div>
      </div>
    </div>
  );
}
