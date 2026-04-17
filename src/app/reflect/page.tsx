"use client";

import { useStore, uid, today } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReflectPage() {
  const { data, update } = useStore();
  const router = useRouter();
  const todayStr = today();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [wins, setWins] = useState(["", "", ""]);
  const [challenges, setChallenges] = useState(["", ""]);
  const [reflection, setReflection] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const existingEntry = data.journal.find(
    (j) => j.date === todayStr && j.type === "evening"
  );

  if (existingEntry) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">&#127769;</div>
          <h1 className="text-xl font-bold mb-2">Evening reflection complete</h1>
          <p className="text-muted text-sm mb-4">
            Mood: {existingEntry.mood}/5 | Energy: {existingEntry.energy}/5
          </p>
          {existingEntry.aiResponse && (
            <div className="bg-card border border-accent/20 rounded-xl p-4 text-left text-sm mt-4 mb-6">
              <div className="text-accent font-medium mb-2">Coach Response</div>
              <div className="text-muted whitespace-pre-wrap">{existingEntry.aiResponse}</div>
            </div>
          )}
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

  // Calculate today's stats for AI context
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const todayLogs = data.habitLogs.filter((l) => l.date === todayStr);
  const habitsCompleted = todayLogs.filter((l) => l.completed).length;
  const tasksCompletedToday = data.tasks.filter((t) => t.completed).length;
  const morningEntry = data.journal.find((j) => j.date === todayStr && j.type === "morning");

  async function getAiCoaching() {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "evening_reflection",
          mood,
          energy,
          wins: wins.filter(Boolean),
          challenges: challenges.filter(Boolean),
          reflection,
          morningMood: morningEntry?.mood,
          morningEnergy: morningEntry?.energy,
          morningIntention: morningEntry?.content,
          habitsCompleted,
          totalHabits: dailyHabits.length,
          tasksCompleted: tasksCompletedToday,
        }),
      });
      const data = await res.json();
      setAiResponse(data.message || "");
    } catch {
      setAiResponse("Unable to connect to AI coach right now. Your reflection has been saved.");
    }
    setLoadingAi(false);
  }

  async function submit() {
    // Get AI coaching first
    await getAiCoaching();

    // Save journal entry
    update((d) => ({
      ...d,
      journal: [
        ...d.journal,
        {
          id: uid(),
          date: todayStr,
          type: "evening" as const,
          mood,
          energy,
          wins: wins.filter(Boolean),
          challenges: challenges.filter(Boolean),
          content: reflection,
          aiResponse,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }

  const steps = [
    // Step 0: End-of-day mood
    <div key="mood" className="space-y-6">
      <h2 className="text-lg font-semibold">How are you feeling tonight?</h2>
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
        <span>Drained</span>
        <span>Energized</span>
      </div>

      {/* Day summary */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-2">
        <div className="text-xs text-muted font-semibold uppercase">Today&apos;s Stats</div>
        <div className="flex justify-between text-sm">
          <span>Habits completed</span>
          <span className="font-medium">{habitsCompleted}/{dailyHabits.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tasks done</span>
          <span className="font-medium">{tasksCompletedToday}</span>
        </div>
        {morningEntry && (
          <div className="flex justify-between text-sm">
            <span>Morning mood</span>
            <span className="font-medium">{morningEntry.mood}/5</span>
          </div>
        )}
      </div>
    </div>,

    // Step 2: Wins
    <div key="wins" className="space-y-4">
      <h2 className="text-lg font-semibold">Today&apos;s wins</h2>
      <p className="text-sm text-muted">What went well? What are you proud of?</p>
      {wins.map((w, i) => (
        <input
          key={i}
          type="text"
          placeholder={`Win ${i + 1}`}
          value={w}
          onChange={(e) => {
            const next = [...wins];
            next[i] = e.target.value;
            setWins(next);
          }}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
        />
      ))}
    </div>,

    // Step 3: Challenges
    <div key="challenges" className="space-y-4">
      <h2 className="text-lg font-semibold">Challenges</h2>
      <p className="text-sm text-muted">What was hard? What would you do differently?</p>
      {challenges.map((c, i) => (
        <input
          key={i}
          type="text"
          placeholder={`Challenge ${i + 1}`}
          value={c}
          onChange={(e) => {
            const next = [...challenges];
            next[i] = e.target.value;
            setChallenges(next);
          }}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
        />
      ))}
    </div>,

    // Step 4: Free reflection
    <div key="reflection" className="space-y-4">
      <h2 className="text-lg font-semibold">Anything else on your mind?</h2>
      <textarea
        placeholder="Free-form reflection..."
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={5}
        className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
      />
    </div>,
  ];

  // AI response screen (after submit)
  if (aiResponse) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">&#127769;</div>
          <h1 className="text-xl font-bold">Reflection saved</h1>
        </div>

        <div className="bg-card border border-accent/20 rounded-xl p-4">
          <div className="text-accent font-medium mb-2 text-sm">Your AI Coach</div>
          <div className="text-sm whitespace-pre-wrap">{aiResponse}</div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
        >
          Done
        </button>
      </div>
    );
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

      <div className="mb-2 text-xs text-muted">Evening Reflection</div>

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
            disabled={loadingAi}
            className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {loadingAi ? "Getting coaching..." : "Complete Reflection"}
          </button>
        )}
      </div>
    </div>
  );
}
