"use client";

import { useStore, today, getStreak } from "@/lib/store";
import Link from "next/link";

const DOMAINS = [
  { key: "personal", label: "Personal", color: "bg-personal", href: "/personal" },
  { key: "family", label: "Family", color: "bg-family", href: "/family" },
  { key: "work", label: "Work", color: "bg-work", href: "/work" },
  { key: "growth", label: "Growth", color: "bg-growth", href: "/growth" },
  { key: "balance", label: "Balance", color: "bg-balance", href: "/balance" },
] as const;

export default function Dashboard() {
  const { data, loaded, update } = useStore();
  const todayStr = today();

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  // Today's habits
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const todayLogs = data.habitLogs.filter((l) => l.date === todayStr);
  const completedToday = todayLogs.filter((l) => l.completed).length;
  const habitProgress = dailyHabits.length > 0 ? completedToday / dailyHabits.length : 0;

  // Today's tasks
  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const highPriority = pendingTasks.filter((t) => t.priority === "high");

  // Today's journal
  const todayJournal = data.journal.find((j) => j.date === todayStr && j.type === "morning");
  const eveningJournal = data.journal.find((j) => j.date === todayStr && j.type === "evening");

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function toggleHabit(habitId: string) {
    const existing = todayLogs.find((l) => l.habitId === habitId);
    if (existing) {
      update((d) => ({
        ...d,
        habitLogs: d.habitLogs.map((l) =>
          l.habitId === habitId && l.date === todayStr
            ? { ...l, completed: !l.completed }
            : l
        ),
      }));
    } else {
      update((d) => ({
        ...d,
        habitLogs: [...d.habitLogs, { habitId, date: todayStr, completed: true }],
      }));
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}, Parker</h1>
        <p className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-accent">{Math.round(habitProgress * 100)}%</div>
          <div className="text-[11px] text-muted mt-0.5">Habits</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-danger">{highPriority.length}</div>
          <div className="text-[11px] text-muted mt-0.5">High Priority</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-success">{pendingTasks.length}</div>
          <div className="text-[11px] text-muted mt-0.5">Open Tasks</div>
        </div>
      </div>

      {/* Daily Workflow CTAs */}
      {!todayJournal && (
        <Link
          href="/checkin"
          className="block bg-accent/10 border border-accent/20 rounded-xl p-4 text-center"
        >
          <div className="text-accent font-semibold">Start your day</div>
          <div className="text-muted text-sm mt-1">Morning check-in</div>
        </Link>
      )}
      {todayJournal && !eveningJournal && hour >= 17 && (
        <Link
          href="/reflect"
          className="block bg-personal/10 border border-personal/20 rounded-xl p-4 text-center"
        >
          <div className="text-personal font-semibold">Wind down</div>
          <div className="text-muted text-sm mt-1">Evening reflection</div>
        </Link>
      )}

      {/* Today's Habits */}
      {dailyHabits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Today&apos;s Habits</h2>
            <span className="text-xs text-muted">{completedToday}/{dailyHabits.length}</span>
          </div>
          <div className="space-y-2">
            {dailyHabits.map((habit) => {
              const log = todayLogs.find((l) => l.habitId === habit.id);
              const done = log?.completed ?? false;
              const streak = getStreak(habit.id, data.habitLogs);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    done
                      ? "bg-success/10 border-success/30"
                      : "bg-card border-card-border"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      done ? "bg-success border-success" : "border-muted"
                    }`}
                  >
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={`flex-1 text-left text-sm ${done ? "line-through text-muted" : ""}`}>
                    {habit.name}
                  </span>
                  {streak > 0 && (
                    <span className="text-xs text-warning font-medium">{streak}d</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Domain Overview */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Life Domains</h2>
        <div className="grid grid-cols-2 gap-3">
          {DOMAINS.map((domain) => {
            const domainTasks = pendingTasks.filter((t) => t.domain === domain.key);
            const domainGoals = data.goals.filter((g) => g.domain === domain.key);
            return (
              <Link
                key={domain.key}
                href={domain.href}
                className="bg-card border border-card-border rounded-xl p-4 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${domain.color}`} />
                  <span className="text-sm font-medium">{domain.label}</span>
                </div>
                <div className="text-xs text-muted space-y-0.5">
                  <div>{domainTasks.length} tasks</div>
                  <div>{domainGoals.length} goals</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* High Priority Tasks */}
      {highPriority.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">High Priority</h2>
          <div className="space-y-2">
            {highPriority.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3"
              >
                <button
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      tasks: d.tasks.map((t) =>
                        t.id === task.id ? { ...t, completed: true } : t
                      ),
                    }))
                  }
                  className="w-5 h-5 rounded border-2 border-danger flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{task.title}</div>
                  <div className="text-[11px] text-muted capitalize">{task.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
