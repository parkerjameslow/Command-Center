"use client";

import { useState, useMemo } from "react";
import { useStore, uid, today } from "@/lib/store";

export interface Suggestion {
  category: string;
  title: string;
  why: string;
  bg: string;
}

interface Top3Props {
  title: string;
  subtitle: string;
  suggestions: Suggestion[];
  domain: "personal" | "family" | "work" | "growth";
  journalCategory: "service" | "connection" | "win" | "lesson" | "reflection";
}

export function Top3Suggestions({ title, subtitle, suggestions, domain, journalCategory }: Top3Props) {
  const { data, update } = useStore();
  const todayStr = today();
  const [addModal, setAddModal] = useState<{ title: string } | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [completing, setCompleting] = useState<Set<number>>(new Set());

  // Which suggestion titles have already been completed today?
  const completedTitles = useMemo(() => {
    const s = new Set<string>();
    for (const t of data.tasks) {
      if (!t.completed || t.domain !== domain) continue;
      const d = new Date(t.createdAt).toISOString().slice(0, 10);
      if (d === todayStr) s.add(t.title);
    }
    return s;
  }, [data.tasks, domain, todayStr]);

  function complete(idx: number, title: string) {
    if (completedTitles.has(title)) return; // guard against double
    setCompleting((prev) => new Set(prev).add(idx));
    setTimeout(() => {
      update((d) => ({
        ...d,
        tasks: [...d.tasks, {
          id: uid(),
          title,
          domain,
          priority: "high" as const,
          completed: true,
          createdAt: new Date().toISOString(),
        }],
        journalLogs: [...(d.journalLogs || []), {
          id: uid(),
          date: todayStr,
          category: journalCategory,
          title: `${title} — completed`,
          content: title,
          mood: 4,
          createdAt: new Date().toISOString(),
        }],
      }));
      setCompleting((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }, 500);
  }

  function addAsTask() {
    if (!addModal) return;
    update((d) => ({
      ...d,
      tasks: [...d.tasks, {
        id: uid(),
        title: addModal.title,
        domain,
        priority: "medium" as const,
        completed: false,
        dueDate: dueDate || undefined,
        createdAt: new Date().toISOString(),
      }],
    }));
    setAddModal(null);
    setDueDate("");
    setDueTime("");
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 pb-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">{title}</h2>
          <p className="text-xs text-muted mb-3">{subtitle}</p>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const isCompleting = completing.has(i);
              const isDone = completedTitles.has(s.title);
              const showDoneState = isDone && !isCompleting;
              return (
                <div
                  key={i}
                  className={`border rounded-xl p-4 transition-all duration-500 ${
                    isCompleting
                      ? "opacity-60 scale-95 bg-success/10 border-success/40"
                      : showDoneState
                      ? "bg-success/5 border-success/30"
                      : s.bg
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] text-muted uppercase font-semibold">{s.category}</div>
                    {showDoneState && (
                      <div className="flex items-center gap-1 text-[10px] text-success font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        DONE
                      </div>
                    )}
                  </div>
                  <p className={`text-sm font-medium mb-1 ${showDoneState ? "line-through text-muted" : ""}`}>
                    {s.title}
                  </p>
                  {!showDoneState && <p className="text-xs text-muted">{s.why}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => complete(i, s.title)}
                      disabled={isCompleting || isDone}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        isDone
                          ? "bg-success/20 text-success cursor-default"
                          : "bg-success text-white disabled:opacity-50"
                      }`}
                    >
                      {isDone ? "Completed" : isCompleting ? "Saving..." : "Done"}
                    </button>
                    {!isDone && (
                      <button
                        onClick={() => setAddModal({ title: s.title })}
                        disabled={isCompleting}
                        className="px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs font-medium text-muted disabled:opacity-50"
                      >
                        Add to Tasks
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Add to Tasks Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
          <div className="bg-background w-full max-w-lg rounded-t-2xl">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Add to Tasks</h2>
                <button onClick={() => { setAddModal(null); setDueDate(""); setDueTime(""); }} className="text-muted hover:text-foreground p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="bg-card border border-card-border rounded-xl p-3">
                <div className="text-sm">{addModal.title}</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Due date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Due time (optional)</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>

              <button
                onClick={addAsTask}
                className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
              >
                Add to List
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
