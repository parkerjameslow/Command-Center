"use client";

import { useStore, today, getStreak, uid, type Nudge } from "@/lib/store";
import { generateNudges } from "@/lib/nudgeEngine";
import { NudgeCards } from "@/components/NudgeCards";
import { NudgeAction } from "@/components/NudgeAction";
import Link from "next/link";
import { useState, useMemo } from "react";

const DOMAINS = [
  { key: "personal", label: "Personal", color: "bg-personal", href: "/personal" },
  { key: "family", label: "Family", color: "bg-family", href: "/family" },
  { key: "work", label: "Work", color: "bg-work", href: "/work" },
  { key: "growth", label: "Growth", color: "bg-growth", href: "/growth" },
] as const;

export default function Dashboard() {
  const { data, loaded, update } = useStore();
  const todayStr = today();
  const [view, setView] = useState<"dashboard" | "high" | "all" | "people">("dashboard");
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);

  // All hooks must be before any early return
  const nudges = useMemo(() => generateNudges(data, todayStr), [data, todayStr]);

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

  function handleNudgeSave(response: string, mood: number) {
    if (!activeNudge) return;

    // Mark nudge as completed
    update((d) => ({
      ...d,
      nudges: [...d.nudges, {
        id: activeNudge.id,
        type: activeNudge.type,
        message: activeNudge.message,
        personId: activeNudge.personId,
        completed: true,
        response: response || undefined,
        date: todayStr,
        createdAt: new Date().toISOString(),
      }],
      // Add to journal log if they wrote something
      ...(response ? {
        journalLogs: [...d.journalLogs, {
          id: uid(),
          date: todayStr,
          category: activeNudge.type === "gratitude" ? "gratitude" as const
            : activeNudge.type === "service" ? "service" as const
            : activeNudge.type === "relationship" ? "connection" as const
            : activeNudge.type === "chore" ? "win" as const
            : "reflection" as const,
          title: activeNudge.message.slice(0, 80),
          content: response,
          mood,
          relatedPersonId: activeNudge.personId || undefined,
          nudgeType: activeNudge.type,
          createdAt: new Date().toISOString(),
        }],
      } : {}),
    }));

    // If it's a relationship nudge and they responded, mark person as connected
    if (activeNudge.personId && response) {
      markPersonContact(activeNudge.personId);
    }

    setActiveNudge(null);
  }

  function markPersonContact(personId: string) {
    update((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.id === personId ? { ...p, lastContact: todayStr } : p
      ),
    }));
  }

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

  // Drill-down views
  // People drill-down view
  if (view === "people") {
    const peopleWithStatus = data.people
      .map((person) => {
        const days = person.lastContact
          ? Math.floor((new Date(todayStr + "T00:00:00").getTime() - new Date(person.lastContact + "T00:00:00").getTime()) / 86400000)
          : 999;
        const ratio = days / person.contactFrequency;
        const status: "good" | "due" | "overdue" =
          ratio < 0.7 ? "good" : ratio < 1 ? "due" : "overdue";
        const daysUntilDue = Math.max(0, person.contactFrequency - days);
        return { person, days, status, ratio, daysUntilDue };
      })
      .sort((a, b) => b.ratio - a.ratio);

    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="text-muted hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">My People</h1>
        </div>

        {peopleWithStatus.map(({ person, days, status, daysUntilDue }) => {
          const suggestion = getPersonSuggestion(person, days);
          return (
            <Link
              key={person.id}
              href={`/people/${person.id}`}
              className={`block bg-card border rounded-xl p-4 ${
                status === "overdue"
                  ? "border-danger/30"
                  : status === "due"
                  ? "border-warning/30"
                  : "border-card-border"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  status === "overdue" ? "bg-danger animate-pulse" : status === "due" ? "bg-warning" : "bg-success"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{person.name}</span>
                    <span className="text-[10px] text-muted capitalize">{person.relationship}</span>
                  </div>
                  <div className="text-[11px] text-muted">
                    {days === 0 ? "Connected today" : days === 999 ? "No contact yet" : `${days}d ago`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {status === "overdue" ? (
                    <span className="text-xs text-danger font-medium">Overdue</span>
                  ) : status === "due" ? (
                    <span className="text-xs text-warning font-medium">Due soon</span>
                  ) : (
                    <span className="text-[11px] text-muted">{daysUntilDue}d left</span>
                  )}
                </div>
              </div>
              {suggestion && (
                <div className="text-[12px] text-muted italic leading-relaxed pl-6">
                  {suggestion}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  if (view === "high" || view === "all") {
    const tasksToShow = view === "high" ? highPriority : pendingTasks;
    const title = view === "high" ? "High Priority Tasks" : "All Open Tasks";

    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("dashboard")}
            className="text-muted hover:text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
          <span className="text-sm text-muted">({tasksToShow.length})</span>
        </div>

        {tasksToShow.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No tasks here. Nice work.</div>
        )}

        {tasksToShow
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.priority] - order[b.priority];
          })
          .map((task) => (
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
                className={`w-5 h-5 rounded border-2 flex-shrink-0 ${
                  task.priority === "high"
                    ? "border-danger"
                    : task.priority === "medium"
                    ? "border-warning"
                    : "border-success"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{task.title}</div>
                <div className="text-[11px] text-muted capitalize">{task.domain}</div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  task.priority === "high"
                    ? "bg-danger/20 text-danger"
                    : task.priority === "medium"
                    ? "bg-warning/20 text-warning"
                    : "bg-success/20 text-success"
                }`}
              >
                {task.priority}
              </span>
            </div>
          ))}
      </div>
    );
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
        <button
          onClick={() => setView("high")}
          className="bg-card border border-card-border rounded-xl p-3 text-center hover:border-danger/30 transition-colors"
        >
          <div className="text-2xl font-bold text-danger">{highPriority.length}</div>
          <div className="text-[11px] text-muted mt-0.5">High Priority</div>
        </button>
        <button
          onClick={() => setView("all")}
          className="bg-card border border-card-border rounded-xl p-3 text-center hover:border-success/30 transition-colors"
        >
          <div className="text-2xl font-bold text-success">{pendingTasks.length}</div>
          <div className="text-[11px] text-muted mt-0.5">Open Tasks</div>
        </button>
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

      {/* People Summary Card */}
      {data.people.length > 0 && (() => {
        const total = data.people.length;
        const connectedToday = data.people.filter((p) => p.lastContact === todayStr).length;
        const overdue = data.people.filter((p) => {
          if (!p.lastContact) return true;
          const days = Math.floor((new Date(todayStr + "T00:00:00").getTime() - new Date(p.lastContact + "T00:00:00").getTime()) / 86400000);
          return days >= p.contactFrequency;
        }).length;
        return (
          <button
            onClick={() => setView("people")}
            className="w-full bg-card border border-card-border rounded-xl p-4 text-left hover:border-family/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">My People</h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-foreground">{total}</div>
                <div className="text-[10px] text-muted">Tracked</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${connectedToday > 0 ? "text-success" : "text-muted"}`}>{connectedToday}</div>
                <div className="text-[10px] text-muted">Today</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${overdue > 0 ? "text-danger" : "text-success"}`}>{overdue}</div>
                <div className="text-[10px] text-muted">Overdue</div>
              </div>
            </div>
            {overdue > 0 && (
              <div className="mt-3 text-xs text-danger/80 text-center">
                {overdue} {overdue === 1 ? "person needs" : "people need"} your attention
              </div>
            )}
          </button>
        );
      })()}

      {/* Smart Nudges */}
      <NudgeCards
        nudges={nudges}
        people={data.people}
        onNudgeTap={setActiveNudge}
      />

      {/* Nudge Action Modal */}
      {activeNudge && (
        <NudgeAction
          nudge={activeNudge}
          personName={activeNudge.personId ? data.people.find((p) => p.id === activeNudge.personId)?.name : undefined}
          onSave={handleNudgeSave}
          onClose={() => setActiveNudge(null)}
        />
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

function getPersonSuggestion(person: { name: string; relationship: string; contactFrequency: number }, days: number): string | null {
  const { name, relationship } = person;
  const hour = new Date().getHours();
  const dayIdx = Math.floor(Date.now() / 86400000);

  if (days === 0) return null;
  if (days < person.contactFrequency * 0.7) return null;

  if (relationship === "wife") {
    const msgs = [
      hour < 12 ? `Send ${name} a text — not logistics, something real.` : `Put the phone down tonight and be present with ${name}.`,
      `What's weighing on ${name} right now? Ask and just listen.`,
      `Do something for ${name} today she wouldn't expect.`,
    ];
    return msgs[dayIdx % msgs.length];
  }
  if (relationship === "child") {
    const msgs = [
      `Ask ${name} a specific question about their day — not "how was school."`,
      `Give ${name} 15 minutes of undivided attention today.`,
      `Tell ${name} something specific you're proud of them for.`,
    ];
    return msgs[dayIdx % msgs.length];
  }
  if (relationship === "parent" || relationship === "grandparent") {
    return days >= 14
      ? `${days} days. Call ${name} today — they won't be here forever.`
      : `A quick call to ${name} would make their day.`;
  }
  return `Reach out to ${name}. Connection takes intention.`;
}
