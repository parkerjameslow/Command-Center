"use client";

import { useStore, today, getStreak, uid, type Nudge } from "@/lib/store";
import { generateNudges } from "@/lib/nudgeEngine";
import { generateDailyGoals, isGoalCompletedToday, countCompletedOn, expectedTotalOn, getWeekDates } from "@/lib/dailyGoals";
import { selectThemeForDay, wasScriptureReadToday } from "@/lib/spiritual";
import { getSettings } from "@/lib/settings";
import { NudgeCards } from "@/components/NudgeCards";
import { NudgeAction } from "@/components/NudgeAction";
import { OnboardingTour } from "@/components/OnboardingTour";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

const DOMAINS = [
  { key: "personal", label: "Personal", color: "bg-personal", href: "/personal" },
  { key: "family", label: "Family", color: "bg-family", href: "/family" },
  { key: "work", label: "Work", color: "bg-work", href: "/work" },
  { key: "growth", label: "Growth", color: "bg-growth", href: "/growth" },
] as const;

export default function Dashboard() {
  const { data, loaded, update } = useStore();
  const todayStr = today();
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "high" | "all" | "people" | "goals" | "habits" | "nudges">("dashboard");
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);

  // All hooks must be before any early return
  const nudges = useMemo(() => generateNudges(data, todayStr), [data, todayStr]);
  const scriptureTheme = useMemo(() => selectThemeForDay(data, todayStr), [data, todayStr]);

  // One-time redirect to welcome page for new users
  useEffect(() => {
    if (!loaded) return;
    const settings = getSettings(data);
    const pending = typeof window !== "undefined" && sessionStorage.getItem("cc-welcome-pending") === "1";
    if (!settings.welcomeSeen && (pending || data.habits.length + data.tasks.length + data.people.length === 0)) {
      sessionStorage.removeItem("cc-welcome-pending");
      router.push("/welcome");
    }
  }, [loaded, data, router]);

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  // Today's habits (deduplicate by name in case of sync issues)
  const seenHabitNames = new Set<string>();
  const dailyHabits = data.habits.filter((h) => {
    if (h.frequency !== "daily") return false;
    if (seenHabitNames.has(h.name)) return false;
    seenHabitNames.add(h.name);
    return true;
  });
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

    const journalCategory = activeNudge.type === "gratitude" ? "gratitude" as const
      : activeNudge.type === "service" ? "service" as const
      : activeNudge.type === "relationship" ? "connection" as const
      : activeNudge.type === "chore" ? "win" as const
      : "reflection" as const;

    // Mark nudge as completed AND always add a journal entry
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
      journalLogs: [...d.journalLogs, {
        id: uid(),
        date: todayStr,
        category: journalCategory,
        title: activeNudge.message.slice(0, 80),
        content: response || "Completed without notes",
        mood,
        relatedPersonId: activeNudge.personId || undefined,
        nudgeType: activeNudge.type,
        createdAt: new Date().toISOString(),
      }],
    }));

    // If it's a relationship nudge, mark person as connected
    if (activeNudge.personId) {
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

  // Goals drill-down
  // Habits drill-down
  // Nudges drill-down view — all of today's nudges
  if (view === "nudges") {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="text-muted hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Nudges</h1>
          <span className="text-sm text-muted">({nudges.length})</span>
        </div>
        <p className="text-xs text-muted">Your brain — every nudge generated for you today, rotating throughout the day.</p>

        <div className="space-y-2">
          {nudges.map((nudge) => {
            const styles: Record<string, string> = {
              relationship: "bg-family/10 border-family/20",
              chore: "bg-work/10 border-work/20",
              service: "bg-personal/10 border-personal/20",
              self: "bg-growth/10 border-growth/20",
              gratitude: "bg-warning/10 border-warning/20",
            };
            const labels: Record<string, string> = {
              relationship: "Connect",
              chore: "Home",
              service: "Act of Service",
              self: "Self",
              gratitude: "Gratitude",
            };
            const person = nudge.personId ? data.people.find((p) => p.id === nudge.personId) : null;
            return (
              <button
                key={nudge.id}
                onClick={() => setActiveNudge(nudge)}
                className={`w-full text-left border rounded-xl p-4 ${styles[nudge.type]}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {labels[nudge.type]}
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
      </div>
    );
  }

  if (view === "habits") {
    const domains = ["personal", "family", "work", "growth"] as const;
    const domainLabels: Record<string, string> = { personal: "Personal", family: "Family", work: "Chores", growth: "Growth" };

    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="text-muted hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Today&apos;s Habits</h1>
          <span className="text-sm text-muted">({completedToday}/{dailyHabits.length})</span>
        </div>

        {/* Progress bar */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Progress</span>
            <span className={`text-lg font-bold ${habitProgress >= 1 ? "text-success" : habitProgress >= 0.5 ? "text-warning" : "text-danger"}`}>
              {Math.round(habitProgress * 100)}%
            </span>
          </div>
          <div className="h-3 bg-card-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${habitProgress >= 1 ? "bg-success" : habitProgress >= 0.5 ? "bg-warning" : "bg-danger"}`}
              style={{ width: `${Math.min(100, habitProgress * 100)}%` }}
            />
          </div>
        </div>

        {dailyHabits.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No daily habits yet. Add one from any domain page.</div>
        )}

        {domains.map((domain) => {
          const domainHabits = dailyHabits.filter((h) => h.domain === domain);
          if (domainHabits.length === 0) return null;
          return (
            <div key={domain}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{domainLabels[domain]}</h2>
              <div className="space-y-2">
                {domainHabits.map((habit) => {
                  const log = todayLogs.find((l) => l.habitId === habit.id);
                  const done = log?.completed ?? false;
                  const streak = getStreak(habit.id, data.habitLogs);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        done ? "bg-success/10 border-success/30" : "bg-card border-card-border"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        done ? "bg-success border-success" : "border-muted"
                      }`}>
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
            </div>
          );
        })}
      </div>
    );
  }

  if (view === "goals") {
    const allGoals = data.goals;
    const domains = ["personal", "family", "work", "growth"] as const;

    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("dashboard")} className="text-muted hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Goals</h1>
          <span className="text-sm text-muted">({allGoals.length})</span>
        </div>

        {allGoals.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">No goals yet. Add one from any domain page.</div>
        )}

        {domains.map((domain) => {
          const domainGoals = allGoals.filter((g) => g.domain === domain);
          if (domainGoals.length === 0) return null;
          return (
            <div key={domain}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 capitalize">{domain}</h2>
              <div className="space-y-2">
                {domainGoals.map((goal) => {
                  const progress = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0;
                  return (
                    <div key={goal.id} className="bg-card border border-card-border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-muted">{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="h-2 bg-card-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progress >= 1 ? "bg-success" : "bg-accent"}`}
                          style={{ width: `${Math.min(100, progress * 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-muted mt-1">
                        {goal.currentValue}/{goal.targetValue} {goal.unit}
                        {goal.deadline && ` · due ${goal.deadline}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                <div className="text-[11px] text-muted capitalize">{task.domain === "work" ? "chore" : task.domain}</div>
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
    <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
      <OnboardingTour />

      {/* Date + Settings */}
      <div className="flex items-center justify-between">
        <p className="text-muted text-sm">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <Link
          href="/settings"
          className="text-muted hover:text-foreground p-1 -mr-1"
          aria-label="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* My People — thin tile */}
      {data.people.length > 0 && (() => {
        const overdue = data.people.filter((p) => {
          if (!p.lastContact) return true;
          const days = Math.floor((new Date(todayStr + "T00:00:00").getTime() - new Date(p.lastContact + "T00:00:00").getTime()) / 86400000);
          return days >= p.contactFrequency;
        }).length;
        const subtitle = overdue === 0
          ? "Everyone up to date"
          : `${overdue} ${overdue === 1 ? "person" : "people"} overdue`;
        return (
          <button
            onClick={() => setView("people")}
            className="w-full flex items-center justify-between bg-card border border-card-border rounded-xl px-4 py-2.5 hover:border-family/30 transition-colors"
          >
            <span className="text-sm font-medium">My People</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${overdue > 0 ? "text-danger" : "text-success"}`}>
                {subtitle}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        );
      })()}

      {/* Everyday Events Card */}
      {(() => {
        const dailyGoalsAll = generateDailyGoals(data, todayStr);
        const dailyGoalsDone = dailyGoalsAll.filter((g) => isGoalCompletedToday(data, g.id, todayStr)).length;
        const weekDates = getWeekDates(todayStr);
        const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
        return (
          <Link
            href="/everyday-events"
            className="block bg-card border border-card-border rounded-xl p-4 hover:border-growth/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium">Everyday Events</div>
                <div className="text-xs text-muted">
                  Essentials + suggestions tailored to you
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  dailyGoalsDone === dailyGoalsAll.length
                    ? "bg-success/15 text-success"
                    : "bg-growth/15 text-growth"
                }`}>
                  {dailyGoalsDone}/{dailyGoalsAll.length}
                </span>
                <svg className="text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
            {/* Weekly progress dots */}
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((dateStr, i) => {
                const done = countCompletedOn(data, dateStr);
                const total = expectedTotalOn(data, dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                const isPerfect = !isFuture && done >= total && total > 0;
                const partial = !isFuture && done > 0 && done < total;
                return (
                  <div key={dateStr} className="flex flex-col items-center gap-0.5">
                    <div className="text-[9px] text-muted">{dayLabels[i]}</div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        isFuture
                          ? "border border-dashed border-card-border opacity-40"
                          : isPerfect
                          ? "bg-success"
                          : partial
                          ? "bg-warning/40 border border-warning/50"
                          : "bg-card-border"
                      } ${isToday ? "ring-1 ring-accent" : ""}`}
                    >
                      {isPerfect && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Link>
        );
      })()}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setView("habits")}
          className="bg-card border border-card-border rounded-xl p-2.5 text-center hover:border-accent/30 transition-colors"
        >
          <div className="text-xl font-bold text-accent">{completedToday}/{dailyHabits.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Habits</div>
        </button>
        <button
          onClick={() => setView("high")}
          className="bg-card border border-card-border rounded-xl p-2.5 text-center hover:border-danger/30 transition-colors"
        >
          <div className="text-xl font-bold text-danger">{highPriority.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Priority</div>
        </button>
        <button
          onClick={() => setView("all")}
          className="bg-card border border-card-border rounded-xl p-2.5 text-center hover:border-success/30 transition-colors"
        >
          <div className="text-xl font-bold text-success">{pendingTasks.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Tasks</div>
        </button>
        <button
          onClick={() => setView("goals")}
          className="bg-card border border-card-border rounded-xl p-2.5 text-center hover:border-accent/30 transition-colors"
        >
          <div className="text-xl font-bold text-accent-light">{data.goals.length}</div>
          <div className="text-[10px] text-muted mt-0.5">Goals</div>
        </button>
      </div>

      {/* Scripture + Check-in side-by-side tiles */}
      {(() => {
        const settings = getSettings(data);
        const showScripture = settings.scriptureEnabled && hour >= 6 && !wasScriptureReadToday(data, todayStr);
        const showMorning = !todayJournal && hour >= 6 && hour < 12;
        const showMidday = hour >= 12 && hour < 18 && !(data.journalLogs || []).find((j) => j.date === todayStr && j.nudgeType === "midday-checkin");
        const showEvening = !eveningJournal && hour >= 18;
        const showCheckin = showMorning || showMidday || showEvening;

        if (!showScripture && !showCheckin) return null;

        const checkinTile = showMorning ? (
          <Link
            href="/checkin"
            className="flex-1 bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col justify-between min-h-[140px]"
          >
            <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Morning</div>
            <div>
              <div className="text-accent font-semibold">Start your day</div>
              <div className="text-muted text-xs mt-1">Morning check-in</div>
            </div>
          </Link>
        ) : showMidday ? (
          <Link
            href="/midday"
            className="flex-1 bg-work/10 border border-work/20 rounded-xl p-4 flex flex-col justify-between min-h-[140px]"
          >
            <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Midday</div>
            <div>
              <div className="text-work font-semibold">Midday check-in</div>
              <div className="text-muted text-xs mt-1">Pulse check and refocus</div>
            </div>
          </Link>
        ) : showEvening ? (
          <Link
            href="/reflect"
            className="flex-1 bg-personal/10 border border-personal/20 rounded-xl p-4 flex flex-col justify-between min-h-[140px]"
          >
            <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Evening</div>
            <div>
              <div className="text-personal font-semibold">End of day check-in</div>
              <div className="text-muted text-xs mt-1">Reflect on today&apos;s wins</div>
            </div>
          </Link>
        ) : null;

        const scriptureTile = showScripture ? (
          <Link
            href="/scripture"
            className="flex-1 bg-gradient-to-br from-accent/10 to-warning/5 border border-accent/20 rounded-xl p-4 flex flex-col justify-between min-h-[140px]"
          >
            <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Scripture of the Day</div>
            <div>
              <div className="text-accent font-semibold">{scriptureTheme.title}</div>
              <div className="text-muted text-xs mt-1 italic line-clamp-2">{scriptureTheme.summary}</div>
            </div>
          </Link>
        ) : null;

        return (
          <div className="flex gap-3">
            {scriptureTile}
            {checkinTile}
          </div>
        );
      })()}

      {/* Smart Nudges — rotating queue */}
      <NudgeCards
        nudges={nudges}
        people={data.people}
        onNudgeTap={setActiveNudge}
        onSeeAll={() => setView("nudges")}
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

      {/* Domain Overview — Rich Data Cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Life Domains</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Personal Card */}
          <Link href="/personal" className="bg-card border border-card-border rounded-xl p-4 hover:border-personal/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-personal" />
              <span className="text-sm font-medium">Personal</span>
            </div>
            {(() => {
              const personalHabits = dailyHabits.filter((h) => h.domain === "personal");
              const personalDone = personalHabits.filter((h) => todayLogs.find((l) => l.habitId === h.id && l.completed)).length;
              const systemMarkers = new Set(["midday-checkin", "user-settings", "scripture-daily", "daily-goal"]);
              const journalCount = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 7 && !systemMarkers.has(j.nudgeType || "")).length;

              // Broadened mood average: pull from all mood signals in last 7 days
              const allMoods: number[] = [];
              // Morning/evening check-ins
              for (const j of data.journal) {
                if (j.mood && daysBetween(j.date, todayStr) <= 7) allMoods.push(j.mood);
              }
              // Journal log moods (gratitude, win, reflection, lesson, nudge responses, midday check-in)
              for (const j of (data.journalLogs || [])) {
                if (j.mood && daysBetween(j.date, todayStr) <= 7) allMoods.push(j.mood);
              }
              // Connection log moods (how did that call/text feel)
              for (const c of (data.connectionLogs || [])) {
                if (c.mood && daysBetween(c.date, todayStr) <= 7) allMoods.push(c.mood);
              }
              const avgMood = allMoods.length > 0 ? (allMoods.reduce((a, b) => a + b, 0) / allMoods.length).toFixed(1) : "—";
              return (
                <div className="text-xs text-muted space-y-1">
                  {personalHabits.length > 0 && <div>{personalDone}/{personalHabits.length} habits done</div>}
                  <div>Mood avg: <span className="text-foreground font-medium">{avgMood}</span>/5</div>
                  <div>{journalCount} journal entries this week</div>
                </div>
              );
            })()}
          </Link>

          {/* Family Card */}
          <Link href="/family" className="bg-card border border-card-border rounded-xl p-4 hover:border-family/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-family" />
              <span className="text-sm font-medium">Family</span>
            </div>
            {(() => {
              const overdueRelationships = data.people.filter((p) => {
                if (!p.lastContact) return true;
                return daysBetween(p.lastContact, todayStr) >= p.contactFrequency;
              });
              const connectedToday = data.people.filter((p) => p.lastContact === todayStr).length;
              const upcomingEvents = data.familyEvents.filter((e) => e.date >= todayStr && daysBetween(todayStr, e.date) <= 7).length;
              const mostOverdue = overdueRelationships.sort((a, b) => {
                const aDays = a.lastContact ? daysBetween(a.lastContact, todayStr) : 999;
                const bDays = b.lastContact ? daysBetween(b.lastContact, todayStr) : 999;
                return bDays - aDays;
              })[0];
              return (
                <div className="text-xs text-muted space-y-1">
                  <div><span className="text-success font-medium">{connectedToday}</span> connected today</div>
                  {overdueRelationships.length > 0 && (
                    <div className="text-danger">{overdueRelationships.length} overdue</div>
                  )}
                  {mostOverdue && (
                    <div>Reach out to <span className="text-foreground font-medium">{mostOverdue.name}</span></div>
                  )}
                  {upcomingEvents > 0 && <div>{upcomingEvents} events this week</div>}
                </div>
              );
            })()}
          </Link>

          {/* Chores Card */}
          <Link href="/chores" className="bg-card border border-card-border rounded-xl p-4 hover:border-work/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-work" />
              <span className="text-sm font-medium">Chores</span>
            </div>
            {(() => {
              const choreTasks = pendingTasks.filter((t) => t.domain === "work");
              const choresDone = data.tasks.filter((t) => t.domain === "work" && t.completed).length;
              const choreNudgesDone = data.nudges.filter((n) => n.type === "chore" && n.completed && daysBetween(n.date, todayStr) <= 7).length;
              const serviceNudgesDone = data.nudges.filter((n) => n.type === "service" && n.completed && daysBetween(n.date, todayStr) <= 7).length;
              const totalNudgesThisWeek = choreNudgesDone + serviceNudgesDone;
              const choreJournalLogs = (data.journalLogs || []).filter((j) => (j.category === "service" || j.nudgeType === "chore") && daysBetween(j.date, todayStr) <= 7).length;
              return (
                <div className="text-xs text-muted space-y-1">
                  <div><span className="text-foreground font-medium">{choreTasks.length}</span> open chores</div>
                  <div>{choresDone} completed</div>
                  {totalNudgesThisWeek > 0 && <div><span className="text-success font-medium">{totalNudgesThisWeek}</span> nudges done this week</div>}
                  {choreJournalLogs > 0 && <div>{choreJournalLogs} logged this week</div>}
                </div>
              );
            })()}
          </Link>

          {/* Growth Card */}
          <Link href="/growth" className="bg-card border border-card-border rounded-xl p-4 hover:border-growth/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-growth" />
              <span className="text-sm font-medium">Growth</span>
            </div>
            {(() => {
              // Connection score: % of people you're current with
              const totalPeople = data.people.length;
              const currentPeople = data.people.filter((p) => {
                if (!p.lastContact) return false;
                return daysBetween(p.lastContact, todayStr) < p.contactFrequency;
              }).length;
              const connectionScore = totalPeople > 0 ? Math.round((currentPeople / totalPeople) * 100) : null;

              // Service score: nudges completed this week
              const thisWeekNudges = data.nudges.filter((n) => n.completed && daysBetween(n.date, todayStr) <= 7).length;

              // Habit consistency (7-day)
              const last7Habits = data.habitLogs.filter((l) => l.completed && daysBetween(l.date, todayStr) <= 7).length;
              const possibleHabits = dailyHabits.length * 7;
              const habitScore = possibleHabits > 0 ? Math.round((last7Habits / possibleHabits) * 100) : null;

              // Mood trend
              const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
              const olderMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) > 7 && daysBetween(j.date, todayStr) <= 14).map((j) => j.mood!);
              const recentAvg = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : null;
              const olderAvg = olderMoods.length > 0 ? olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length : null;
              const moodTrend = recentAvg !== null && olderAvg !== null
                ? recentAvg > olderAvg + 0.3 ? "up" : recentAvg < olderAvg - 0.3 ? "down" : "steady"
                : null;

              return (
                <div className="text-xs text-muted space-y-1">
                  {connectionScore !== null && (
                    <div>Relationships: <span className={`font-medium ${connectionScore >= 80 ? "text-success" : connectionScore >= 50 ? "text-warning" : "text-danger"}`}>{connectionScore}%</span> current</div>
                  )}
                  {habitScore !== null && (
                    <div>Habits: <span className={`font-medium ${habitScore >= 80 ? "text-success" : habitScore >= 50 ? "text-warning" : "text-danger"}`}>{habitScore}%</span> this week</div>
                  )}
                  <div>{thisWeekNudges} nudges acted on</div>
                  {moodTrend && (
                    <div>Mood: <span className={`font-medium ${moodTrend === "up" ? "text-success" : moodTrend === "down" ? "text-danger" : "text-foreground"}`}>{moodTrend === "up" ? "↑ improving" : moodTrend === "down" ? "↓ declining" : "→ steady"}</span></div>
                  )}
                </div>
              );
            })()}
          </Link>
        </div>
      </section>

      {/* Journal Card */}
      {(() => {
        const systemMarkers = new Set(["midday-checkin", "user-settings", "scripture-daily", "daily-goal"]);
        const todayEntries = [
          ...(data.journalLogs || []).filter((j) => j.date === todayStr && !systemMarkers.has(j.nudgeType || "")),
          ...data.journal.filter((j) => j.date === todayStr),
          ...data.connectionLogs.filter((c) => c.date === todayStr && c.note),
        ].length;
        return (
          <Link
            href="/journal"
            className="flex items-center justify-between bg-card border border-card-border rounded-xl p-4 hover:border-accent/30 transition-colors"
          >
            <div>
              <div className="text-sm font-medium">Journal</div>
              <div className="text-xs text-muted">
                {todayEntries > 0 ? `${todayEntries} entries today` : "Your growth story, day by day"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayEntries > 0 && (
                <span className="px-2.5 py-1 bg-accent/15 text-accent rounded-full text-xs font-bold">
                  {todayEntries}
                </span>
              )}
              <svg className="text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        );
      })()}

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
                  <div className="text-[11px] text-muted capitalize">{task.domain === "work" ? "chore" : task.domain}</div>
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

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
