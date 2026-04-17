"use client";

import { useState } from "react";
import { useStore, today } from "@/lib/store";

interface CompletedCardProps {
  domain: "personal" | "family" | "work" | "growth";
  label?: string;
}

export function CompletedCard({ domain, label }: CompletedCardProps) {
  const { data } = useStore();
  const [expanded, setExpanded] = useState(false);
  const todayStr = today();

  const completedToday = data.tasks.filter((t) => {
    if (!t.completed || t.domain !== domain) return false;
    const d = new Date(t.createdAt).toISOString().slice(0, 10);
    return d === todayStr;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const title = label || "Completed Today";

  return (
    <div className="max-w-lg mx-auto px-4 pb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-card border border-card-border rounded-xl p-4 hover:border-success/30 transition-colors"
      >
        <div className="text-left">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted">
            {completedToday.length === 0
              ? "Nothing completed yet today"
              : completedToday.length === 1
              ? "1 task completed today"
              : `${completedToday.length} tasks completed today`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {completedToday.length > 0 && (
            <span className="px-2.5 py-1 bg-success/15 text-success rounded-full text-xs font-bold">
              {completedToday.length}
            </span>
          )}
          <svg
            className={`text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>

      {expanded && completedToday.length > 0 && (
        <div className="mt-2 space-y-2">
          {completedToday.map((task) => (
            <div
              key={task.id}
              className="bg-success/5 border border-success/20 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded border-2 border-success bg-success flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="flex-1 text-sm line-through text-muted">{task.title}</span>
              <span className="text-[10px] text-muted">
                {new Date(task.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
