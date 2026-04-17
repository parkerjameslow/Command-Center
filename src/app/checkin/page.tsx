"use client";

import { useStore, uid, today } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckInPage() {
  const { data, update } = useStore();
  const router = useRouter();
  const todayStr = today();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [gratitude, setGratitude] = useState(["", "", ""]);
  const [topPriorities, setTopPriorities] = useState(["", "", ""]);
  const [intention, setIntention] = useState("");

  const existingEntry = data.journal.find(
    (j) => j.date === todayStr && j.type === "morning"
  );

  if (existingEntry) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">&#10003;</div>
          <h1 className="text-xl font-bold mb-2">Already checked in today</h1>
          <p className="text-muted text-sm mb-6">
            Mood: {existingEntry.mood}/5 | Energy: {existingEntry.energy}/5
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    // Step 0: Mood
    <div key="mood" className="space-y-6">
      <h2 className="text-lg font-semibold">How are you feeling?</h2>
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setMood(n)}
            className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ${
              mood === n
                ? "bg-accent text-white scale-110"
                : "bg-card border border-card-border"
            }`}
          >
            {["😞", "😕", "😐", "🙂", "😄"][n - 1]}
          </button>
        ))}
      </div>
    </div>,

    // Step 1: Energy
    <div key="energy" className="space-y-6">
      <h2 className="text-lg font-semibold">Energy level?</h2>
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setEnergy(n)}
            className={`w-14 h-14 rounded-full text-sm font-bold flex items-center justify-center transition-all ${
              energy === n
                ? "bg-accent text-white scale-110"
                : "bg-card border border-card-border text-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted px-2">
        <span>Exhausted</span>
        <span>Charged</span>
      </div>
    </div>,

    // Step 2: Gratitude
    <div key="gratitude" className="space-y-4">
      <h2 className="text-lg font-semibold">3 things you&apos;re grateful for</h2>
      {gratitude.map((g, i) => (
        <input
          key={i}
          type="text"
          placeholder={`${i + 1}.`}
          value={g}
          onChange={(e) => {
            const next = [...gratitude];
            next[i] = e.target.value;
            setGratitude(next);
          }}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
        />
      ))}
    </div>,

    // Step 3: Top priorities
    <div key="priorities" className="space-y-4">
      <h2 className="text-lg font-semibold">Top 3 priorities today</h2>
      {topPriorities.map((p, i) => (
        <input
          key={i}
          type="text"
          placeholder={`Priority ${i + 1}`}
          value={p}
          onChange={(e) => {
            const next = [...topPriorities];
            next[i] = e.target.value;
            setTopPriorities(next);
          }}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
        />
      ))}
    </div>,

    // Step 4: Intention
    <div key="intention" className="space-y-4">
      <h2 className="text-lg font-semibold">Today&apos;s intention</h2>
      <textarea
        placeholder="What do you want to focus on today?"
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        rows={4}
        className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
      />
    </div>,
  ];

  function submit() {
    // Save journal entry
    update((d) => ({
      ...d,
      journal: [
        ...d.journal,
        {
          id: uid(),
          date: todayStr,
          type: "morning" as const,
          mood,
          energy,
          gratitude: gratitude.filter(Boolean),
          content: intention,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    // Create tasks from priorities
    const newTasks = topPriorities
      .filter(Boolean)
      .map((title) => ({
        id: uid(),
        title,
        domain: "work" as const,
        priority: "high" as const,
        completed: false,
        dueDate: todayStr,
        createdAt: new Date().toISOString(),
      }));

    if (newTasks.length > 0) {
      update((d) => ({
        ...d,
        tasks: [...d.tasks, ...newTasks],
      }));
    }

    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? "bg-accent" : "bg-card-border"
            }`}
          />
        ))}
      </div>

      <div className="mb-2 text-xs text-muted">Morning Check-in</div>

      {/* Current step */}
      <div className="min-h-[200px]">{steps[step]}</div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 text-muted text-sm"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submit}
            className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium"
          >
            Start My Day
          </button>
        )}
      </div>
    </div>
  );
}
