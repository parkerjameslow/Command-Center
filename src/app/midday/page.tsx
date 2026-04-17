"use client";

import { useStore, uid, today } from "@/lib/store";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const QUOTES = [
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "You don't have to be perfect. You just have to be present.",
  "Small daily improvements over time lead to stunning results.",
  "The quality of your life is determined by the quality of your relationships.",
  "Leadership is not about being in charge. It's about taking care of those in your charge.",
  "A father's love is the foundation his children build their lives upon.",
  "The greatest gift you can give your family is your presence, not your presents.",
  "Consistency beats intensity. Show up every day.",
  "Be the man your dog thinks you are.",
  "The measure of a man is what he does when no one is watching.",
  "Your wife doesn't need a perfect husband. She needs an intentional one.",
  "Children will forget what you said but never forget how you made them feel.",
  "Progress, not perfection.",
  "You're not behind. You're exactly where you need to be to take the next step.",
  "The hard things you do today become the easy things of tomorrow.",
];

export default function MiddayCheckinPage() {
  const { data, loaded, update } = useStore();
  const router = useRouter();
  const todayStr = today();
  const [step, setStep] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [focus, setFocus] = useState(3);
  const [onTrack, setOnTrack] = useState("");
  const [struggle, setStruggle] = useState("");
  const [acceptedRecommendation, setAcceptedRecommendation] = useState(false);
  const [customPriority, setCustomPriority] = useState("");

  const quote = useMemo(() => QUOTES[dayOfYear() % QUOTES.length], []);

  // Generate a recommended priority based on data
  const recommendation = useMemo(() => {
    const overduePeople = data.people.filter((p) => {
      if (!p.lastContact) return true;
      const days = Math.floor((new Date(todayStr + "T00:00:00").getTime() - new Date(p.lastContact + "T00:00:00").getTime()) / 86400000);
      return days >= p.contactFrequency;
    });
    const pendingChores = data.tasks.filter((t) => t.domain === "work" && !t.completed);
    const wife = data.people.find((p) => p.relationship === "wife");
    const kids = data.people.filter((p) => p.relationship === "child");

    if (overduePeople.length > 0) {
      const p = overduePeople[0];
      return `Call or connect with ${p.name} — they're overdue for your attention`;
    }
    if (pendingChores.length > 0) {
      return `Finish: ${pendingChores[0].title}`;
    }
    if (wife) {
      return `Do something thoughtful for ${wife.name} before the evening`;
    }
    if (kids.length > 0) {
      return `Plan quality time with ${kids[dayOfYear() % kids.length].name} tonight`;
    }
    return "Take 15 minutes for something that matters but isn't urgent";
  }, [data, todayStr]);

  // Today's data for pulse indicators
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const todayLogs = data.habitLogs.filter((l) => l.date === todayStr);
  const habitsCompleted = todayLogs.filter((l) => l.completed).length;
  const nudgesDone = data.nudges.filter((n) => n.date === todayStr && n.completed).length;
  const connectionsToday = data.people.filter((p) => p.lastContact === todayStr).length;
  const totalPeople = data.people.length;
  const journalEntries = (data.journalLogs || []).filter((j) => j.date === todayStr).length;
  const morningEntry = data.journal.find((j) => j.date === todayStr && j.type === "morning");

  const existingMidday = (data.journalLogs || []).find(
    (j) => j.date === todayStr && j.nudgeType === "midday-checkin"
  );

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  if (existingMidday) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center py-12">
        <div className="text-4xl mb-4">☀️</div>
        <h1 className="text-xl font-bold mb-2">Midday check-in complete</h1>
        <p className="text-muted text-sm mb-6">Keep the momentum going this afternoon.</p>
        <button onClick={() => router.push("/")} className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  function submit() {
    const priorities: string[] = [];
    if (acceptedRecommendation) priorities.push(recommendation);
    if (customPriority.trim()) priorities.push(customPriority.trim());

    const content = [
      `Energy: ${energy}/5 | Focus: ${focus}/5`,
      onTrack && `On track: ${onTrack}`,
      struggle && `Struggle: ${struggle}`,
      ...priorities.map((p) => `Priority: ${p}`),
    ].filter(Boolean).join("\n");

    const newTasks = priorities.map((title) => ({
      id: uid(),
      title,
      domain: "work" as const,
      priority: "high" as const,
      completed: false,
      dueDate: todayStr,
      createdAt: new Date().toISOString(),
    }));

    update((d) => ({
      ...d,
      journalLogs: [...(d.journalLogs || []), {
        id: uid(),
        date: todayStr,
        category: "reflection" as const,
        title: "Midday Check-in",
        content,
        mood: Math.round((energy + focus) / 2),
        nudgeType: "midday-checkin",
        createdAt: new Date().toISOString(),
      }],
      tasks: [...d.tasks, ...newTasks],
    }));

    router.push("/");
  }

  const steps = [
    // Step 0: Inspirational quote + pulse
    <div key="pulse" className="space-y-6">
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-center">
        <p className="text-sm italic leading-relaxed">&quot;{quote}&quot;</p>
      </div>

      <h2 className="text-lg font-semibold">Your day so far</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className={`bg-card border rounded-xl p-3 text-center ${habitsCompleted >= dailyHabits.length && dailyHabits.length > 0 ? "border-success/30" : "border-card-border"}`}>
          <div className={`text-xl font-bold ${habitsCompleted >= dailyHabits.length && dailyHabits.length > 0 ? "text-success" : "text-foreground"}`}>{habitsCompleted}/{dailyHabits.length}</div>
          <div className="text-[10px] text-muted">Habits</div>
        </div>
        <div className={`bg-card border rounded-xl p-3 text-center ${nudgesDone > 0 ? "border-success/30" : "border-card-border"}`}>
          <div className="text-xl font-bold text-foreground">{nudgesDone}</div>
          <div className="text-[10px] text-muted">Nudges Done</div>
        </div>
        <div className={`bg-card border rounded-xl p-3 text-center ${connectionsToday > 0 ? "border-success/30" : "border-card-border"}`}>
          <div className="text-xl font-bold text-foreground">{connectionsToday}/{totalPeople}</div>
          <div className="text-[10px] text-muted">Connected</div>
        </div>
        <div className={`bg-card border rounded-xl p-3 text-center ${journalEntries > 0 ? "border-success/30" : "border-card-border"}`}>
          <div className="text-xl font-bold text-foreground">{journalEntries}</div>
          <div className="text-[10px] text-muted">Journal</div>
        </div>
      </div>

      {morningEntry && (
        <div className="text-xs text-muted text-center">
          Morning mood: {morningEntry.mood}/5 · Energy: {morningEntry.energy}/5
        </div>
      )}
    </div>,

    // Step 1: Energy + Focus
    <div key="energy" className="space-y-6">
      <h2 className="text-lg font-semibold">How&apos;s your energy right now?</h2>
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setEnergy(n)}
            className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ${energy === n ? "bg-accent text-white scale-110" : "bg-card border border-card-border"}`}>
            {["🔋", "🪫", "⚡", "💪", "🔥"][n - 1]}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6">How focused have you been?</h2>
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setFocus(n)}
            className={`w-14 h-14 rounded-full text-sm font-bold flex items-center justify-center transition-all ${focus === n ? "bg-accent text-white scale-110" : "bg-card border border-card-border text-muted"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted px-2">
        <span>Scattered</span>
        <span>Locked in</span>
      </div>
    </div>,

    // Step 2: On track / Struggles
    <div key="track" className="space-y-4">
      <h2 className="text-lg font-semibold">What&apos;s going well today?</h2>
      <textarea
        placeholder="What are you on track with? Any wins so far?"
        value={onTrack}
        onChange={(e) => setOnTrack(e.target.value)}
        rows={3}
        className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
      />

      <h2 className="text-lg font-semibold">What&apos;s been hard?</h2>
      <textarea
        placeholder="Any struggles, distractions, or things pulling you off course?"
        value={struggle}
        onChange={(e) => setStruggle(e.target.value)}
        rows={3}
        className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
      />
    </div>,

    // Step 3: Afternoon priority — recommendation + custom
    <div key="priority" className="space-y-4">
      <h2 className="text-lg font-semibold">Afternoon priority</h2>
      <p className="text-sm text-muted">Based on your data, here&apos;s what would have the biggest impact right now:</p>

      {/* Recommendation */}
      <button
        onClick={() => setAcceptedRecommendation(!acceptedRecommendation)}
        className={`w-full text-left border rounded-xl p-4 transition-all ${
          acceptedRecommendation
            ? "bg-accent/10 border-accent/30"
            : "bg-card border-card-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            acceptedRecommendation ? "bg-accent border-accent" : "border-muted"
          }`}>
            {acceptedRecommendation && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase font-semibold mb-0.5">Recommended</div>
            <div className="text-sm">{recommendation}</div>
          </div>
        </div>
      </button>

      {/* Custom priority */}
      <div>
        <div className="text-xs text-muted mb-2">Add your own priority (optional)</div>
        <input
          type="text"
          placeholder="Something else on your mind..."
          value={customPriority}
          onChange={(e) => setCustomPriority(e.target.value)}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>
    </div>,
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-card-border"}`} />
        ))}
      </div>

      <div className="mb-2 text-xs text-muted">Midday Check-in</div>

      <div className="min-h-[250px]">{steps[step]}</div>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-muted text-sm">Back</button>
        )}
        <div className="flex-1" />
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium">Next</button>
        ) : (
          <button onClick={submit} className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-medium">Finish Check-in</button>
        )}
      </div>
    </div>
  );
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
