"use client";

import { DomainPage } from "@/components/DomainPage";
import { useStore } from "@/lib/store";

export default function ChoresPage() {
  const { data } = useStore();

  // Stats
  const choreTasks = data.tasks.filter((t) => t.domain === "work");
  const completed = choreTasks.filter((t) => t.completed).length;
  const pending = choreTasks.filter((t) => !t.completed).length;
  const choreNudgesDone = data.nudges.filter((n) => (n.type === "chore" || n.type === "service") && n.completed).length;
  const choreJournalLogs = (data.journalLogs || []).filter((j) => j.category === "service" || j.nudgeType === "chore").length;

  return (
    <div>
      {/* Stats header */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-work" />
          <h1 className="text-xl font-bold">Chores</h1>
        </div>
        <p className="text-sm text-muted mb-4">Home tasks, acts of service, and helping out</p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-foreground">{pending}</div>
            <div className="text-[9px] text-muted">Open</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-success">{completed}</div>
            <div className="text-[9px] text-muted">Done</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-accent">{choreNudgesDone}</div>
            <div className="text-[9px] text-muted">Nudges</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-warning">{choreJournalLogs}</div>
            <div className="text-[9px] text-muted">Logged</div>
          </div>
        </div>
      </div>

      {/* Reuse DomainPage for tasks/habits/goals under "work" domain */}
      <DomainPage
        domain="work"
        title=""
        color="bg-work"
        description=""
      />
    </div>
  );
}
