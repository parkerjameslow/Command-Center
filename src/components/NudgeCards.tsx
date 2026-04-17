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
  onComplete: (nudgeId: string) => void;
  onContactPerson: (personId: string) => void;
}

export function NudgeCards({ nudges, people, onComplete, onContactPerson }: NudgeCardsProps) {
  if (nudges.length === 0) return null;

  // Show max 3 nudges at a time, rotate based on time
  const hour = new Date().getHours();
  const startIdx = Math.floor(hour / 3) % Math.max(1, nudges.length);
  const visible = nudges.slice(startIdx, startIdx + 3).length >= 1
    ? nudges.slice(startIdx, startIdx + 3)
    : nudges.slice(0, 3);

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
        Nudges
      </h2>
      <div className="space-y-2">
        {visible.map((nudge) => {
          const style = TYPE_STYLES[nudge.type];
          const person = nudge.personId
            ? people.find((p) => p.id === nudge.personId)
            : null;

          return (
            <div
              key={nudge.id}
              className={`${style.bg} border ${style.border} rounded-xl p-4 space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{style.icon}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {style.label}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{nudge.message}</p>
              <div className="flex gap-2 pt-1">
                {person && (
                  <button
                    onClick={() => onContactPerson(person.id)}
                    className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium"
                  >
                    Mark Connected
                  </button>
                )}
                <button
                  onClick={() => onComplete(nudge.id)}
                  className="px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs font-medium text-muted"
                >
                  Done
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
