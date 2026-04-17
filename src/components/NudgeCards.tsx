"use client";

import type { Nudge, AppData } from "@/lib/store";

const TYPE_STYLES: Record<Nudge["type"], { bg: string; border: string; label: string }> = {
  relationship: { bg: "bg-family/10", border: "border-family/20", label: "Connect" },
  chore: { bg: "bg-work/10", border: "border-work/20", label: "Home" },
  service: { bg: "bg-personal/10", border: "border-personal/20", label: "Act of Service" },
  self: { bg: "bg-growth/10", border: "border-growth/20", label: "Self" },
  gratitude: { bg: "bg-warning/10", border: "border-warning/20", label: "Gratitude" },
};

interface NudgeCardsProps {
  nudges: Nudge[];
  people: AppData["people"];
  onNudgeTap: (nudge: Nudge) => void;
  onSeeAll?: () => void;
}

export function NudgeCards({ nudges, people, onNudgeTap, onSeeAll }: NudgeCardsProps) {
  if (nudges.length === 0) return null;

  // Rotate nudges throughout the day. Show 3 based on hour.
  // Every hour a new set (with some overlap for continuity)
  const hour = new Date().getHours();
  // Each hour, shift window by 1
  const startIdx = nudges.length > 3 ? (hour % nudges.length) : 0;
  const visible: Nudge[] = [];
  for (let i = 0; i < Math.min(3, nudges.length); i++) {
    visible.push(nudges[(startIdx + i) % nudges.length]);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Nudges</h2>
        {onSeeAll && nudges.length > 0 && (
          <button
            onClick={onSeeAll}
            className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-[11px] font-medium hover:bg-accent/20 transition-colors"
          >
            {nudges.length} active
          </button>
        )}
      </div>
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
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {style.label}
                </span>
                {person && (
                  <span className="text-[11px] text-muted">· {person.name}</span>
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
