"use client";

import { useMemo, useState } from "react";
import { useStore, uid, today } from "@/lib/store";
import { generateDailyGoals, isGoalCompletedToday, type DailyGoal } from "@/lib/dailyGoals";

const CATEGORY_STYLES: Record<DailyGoal["category"], string> = {
  health: "bg-success/5 border-success/20",
  sleep: "bg-accent/5 border-accent/20",
  mind: "bg-growth/5 border-growth/20",
  body: "bg-work/5 border-work/20",
  connection: "bg-family/5 border-family/20",
  spirit: "bg-warning/5 border-warning/20",
};

export function DailyGoals() {
  const { data, update } = useStore();
  const todayStr = today();
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const goals = useMemo(() => generateDailyGoals(data, todayStr), [data, todayStr]);
  const completedToday = goals.filter((g) => isGoalCompletedToday(data, g.id, todayStr)).length;

  function toggle(goal: DailyGoal) {
    const alreadyDone = isGoalCompletedToday(data, goal.id, todayStr);
    if (alreadyDone) {
      // Uncomplete: remove today's journal log for this goal
      update((d) => ({
        ...d,
        journalLogs: (d.journalLogs || []).filter(
          (j) => !(j.date === todayStr && j.nudgeType === "daily-goal" && j.content === goal.id)
        ),
      }));
    } else {
      // Complete with animation
      setCompleting((prev) => new Set(prev).add(goal.id));
      setTimeout(() => {
        update((d) => ({
          ...d,
          journalLogs: [...(d.journalLogs || []), {
            id: uid(),
            date: todayStr,
            category: "win" as const,
            title: goal.title,
            content: goal.id,
            nudgeType: "daily-goal",
            createdAt: new Date().toISOString(),
          }],
        }));
        setCompleting((prev) => {
          const next = new Set(prev);
          next.delete(goal.id);
          return next;
        });
      }, 400);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Daily Goals</h2>
        <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-[11px] font-medium">
          {completedToday}/{goals.length}
        </span>
      </div>
      <p className="text-xs text-muted mb-3">Essentials plus items tailored from your data.</p>

      <div className="space-y-2">
        {goals.map((goal) => {
          const done = isGoalCompletedToday(data, goal.id, todayStr);
          const inFlight = completing.has(goal.id);
          const active = done || inFlight;
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal)}
              className={`w-full text-left border rounded-xl p-3 flex items-start gap-3 transition-all ${
                active ? "bg-success/10 border-success/40" : CATEGORY_STYLES[goal.category]
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                  active ? "bg-success border-success" : "border-muted"
                }`}
              >
                {active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${active ? "line-through text-muted" : ""}`}>{goal.title}</span>
                  {!goal.isDefault && (
                    <span className="text-[9px] uppercase tracking-wide text-muted">Suggested</span>
                  )}
                </div>
                {goal.why && !active && (
                  <p className="text-[11px] text-muted mt-0.5">{goal.why}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
