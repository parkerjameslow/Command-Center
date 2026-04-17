"use client";

import type { Nudge, AppData } from "@/lib/store";

const TYPE_STYLES: Record<Nudge["type"], { bg: string; border: string; icon: string; label: string }> = {
  relationship: { bg: "bg-family/10", border: "border-family/20", icon: "💬", label: "Connect" },
  chore: { bg: "bg-work/10", border: "border-work/20", icon: "🔧", label: "Home" },
  service: { bg: "bg-personal/10", border: "border-personal/20", icon: "❤️", label: "Act of Service" },
  self: { bg: "bg-growth/10", border: "border-growth/20", icon: "🧠", label: "Self" },
  gratitude: { bg: "bg-warning/10", border: "border-warning/20", icon: "✨", label: "Gratitude" },
};

interface NudgeCardsProps {
  nudges: Nudge[];
  people: AppData["people"];
  onNudgeTap: (nudge: Nudge) => void;
  phase?: "morning" | "midday" | "evening";
}

const PHASE_LABELS = {
  morning: "Morning Focus",
  midday: "Midday Check-in",
  evening: "Evening Wind-down",
};

export function NudgeCards({ nudges, people, onNudgeTap, phase }: NudgeCardsProps) {
  if (nudges.length === 0) return null;

  // Show up to 4 nudges
  const visible = nudges.slice(0, 4);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
        {phase ? PHASE_LABELS[phase] : "Nudges"}
      </h2>
      <div className="space-y-2">
        {visible.map((nudge) => {
          const style = TYPE_STYLES[nudge.type];
          const person = nudge.personId
            ? people.find((p) => p.id === nudge.personId)
            : null;

          return (
            <button
              key={nudge.id}
              onClick={() => onNudgeTap(nudge)}
              className={`w-full text-left ${style.bg} border ${style.border} rounded-xl p-4 space-y-2`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{style.icon}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {style.label}
                </span>
                {person && (
                  <span className="text-[11px] text-muted ml-auto">{person.name}</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted ml-auto flex-shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <p className="text-sm leading-relaxed">{nudge.message}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
