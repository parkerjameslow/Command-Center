"use client";

import { useStore, uid, today, getStreak, type Habit, type Task, type Goal } from "@/lib/store";
import { useState } from "react";

interface DomainPageProps {
  domain: "personal" | "family" | "work" | "growth" | "balance";
  title: string;
  color: string;
  description: string;
}

export function DomainPage({ domain, title, color, description }: DomainPageProps) {
  const { data, loaded, update } = useStore();
  const [activeTab, setActiveTab] = useState<"tasks" | "habits" | "goals">("tasks");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newHabitName, setNewHabitName] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalUnit, setNewGoalUnit] = useState("");

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  const todayStr = today();
  const tasks = data.tasks.filter((t) => t.domain === domain);
  const habits = data.habits.filter((h) => h.domain === domain);
  const goals = data.goals.filter((g) => g.domain === domain);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  function addTask() {
    if (!newTaskTitle.trim()) return;
    update((d) => ({
      ...d,
      tasks: [
        ...d.tasks,
        {
          id: uid(),
          title: newTaskTitle.trim(),
          domain,
          priority: newTaskPriority,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNewTaskTitle("");
    setShowAddTask(false);
  }

  function addHabit() {
    if (!newHabitName.trim()) return;
    update((d) => ({
      ...d,
      habits: [
        ...d.habits,
        {
          id: uid(),
          name: newHabitName.trim(),
          domain,
          frequency: "daily" as const,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNewHabitName("");
    setShowAddHabit(false);
  }

  function addGoal() {
    if (!newGoalTitle.trim() || !newGoalTarget) return;
    update((d) => ({
      ...d,
      goals: [
        ...d.goals,
        {
          id: uid(),
          title: newGoalTitle.trim(),
          domain,
          targetValue: Number(newGoalTarget),
          currentValue: 0,
          unit: newGoalUnit || "units",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNewGoalTitle("");
    setNewGoalTarget("");
    setNewGoalUnit("");
    setShowAddGoal(false);
  }

  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());

  function toggleTask(taskId: string) {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;
    // If marking as complete, animate first
    if (!task.completed) {
      setCompletingTasks((prev) => new Set(prev).add(taskId));
      setTimeout(() => {
        update((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          ),
        }));
        setCompletingTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 500);
    } else {
      // Uncomplete immediately (no animation needed)
      update((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: false } : t
        ),
      }));
    }
  }

  function deleteTask(taskId: string) {
    update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== taskId),
    }));
  }

  function toggleHabit(habitId: string) {
    const existing = data.habitLogs.find(
      (l) => l.habitId === habitId && l.date === todayStr
    );
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
        habitLogs: [
          ...d.habitLogs,
          { habitId, date: todayStr, completed: true },
        ],
      }));
    }
  }

  function updateGoalProgress(goalId: string, value: number) {
    update((d) => ({
      ...d,
      goals: d.goals.map((g) =>
        g.id === goalId ? { ...g, currentValue: Math.max(0, value) } : g
      ),
    }));
  }

  function deleteHabit(habitId: string) {
    update((d) => ({
      ...d,
      habits: d.habits.filter((h) => h.id !== habitId),
      habitLogs: d.habitLogs.filter((l) => l.habitId !== habitId),
    }));
  }

  function deleteGoal(goalId: string) {
    update((d) => ({
      ...d,
      goals: d.goals.filter((g) => g.id !== goalId),
    }));
  }

  const tabs = [
    { key: "tasks" as const, label: "Tasks", count: pendingTasks.length },
    { key: "habits" as const, label: "Habits", count: habits.length },
    { key: "goals" as const, label: "Goals", count: goals.length },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <p className="text-sm text-muted">{description}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-xs opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="w-full p-3 border-2 border-dashed border-card-border rounded-xl text-sm text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add Task
          </button>

          {showAddTask && (
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                autoFocus
              />
              <div className="flex gap-2">
                {(["high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                      newTaskPriority === p
                        ? p === "high"
                          ? "bg-danger/20 text-danger"
                          : p === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success"
                        : "bg-card-border text-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-muted text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {pendingTasks.length === 0 && !showAddTask && (
            <div className="text-center py-8 text-muted text-sm">
              No tasks yet. Add one to get started.
            </div>
          )}

          {pendingTasks
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.priority] - order[b.priority];
            })
            .map((task) => {
              const isCompleting = completingTasks.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`bg-card border border-card-border rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${
                    isCompleting ? "opacity-0 scale-95 bg-success/10 border-success/40" : "opacity-100"
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isCompleting
                        ? "bg-success border-success"
                        : task.priority === "high"
                        ? "border-danger"
                        : task.priority === "medium"
                        ? "border-warning"
                        : "border-success"
                    }`}
                  >
                    {isCompleting && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${isCompleting ? "line-through text-muted" : ""}`}>{task.title}</span>
                  {!isCompleting && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-muted hover:text-danger text-xs p-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

          {completedTasks.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-muted cursor-pointer">
                {completedTasks.length} completed
              </summary>
              <div className="space-y-2 mt-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-card/50 border border-card-border rounded-xl p-3 flex items-center gap-3 opacity-60"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded border-2 border-success bg-success flex items-center justify-center flex-shrink-0"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <span className="flex-1 text-sm line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Habits Tab */}
      {activeTab === "habits" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddHabit(!showAddHabit)}
            className="w-full p-3 border-2 border-dashed border-card-border rounded-xl text-sm text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add Habit
          </button>

          {showAddHabit && (
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Habit name..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addHabit}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddHabit(false)}
                  className="px-4 py-2 text-muted text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {habits.length === 0 && !showAddHabit && (
            <div className="text-center py-8 text-muted text-sm">
              No habits tracked yet. Add one to build consistency.
            </div>
          )}

          {habits.map((habit) => {
            const log = data.habitLogs.find(
              (l) => l.habitId === habit.id && l.date === todayStr
            );
            const done = log?.completed ?? false;
            const streak = getStreak(habit.id, data.habitLogs);

            return (
              <div
                key={habit.id}
                className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${
                  done ? "border-success/30 bg-success/5" : "border-card-border"
                }`}
              >
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    done ? "bg-success border-success" : "border-muted"
                  }`}
                >
                  {done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${done ? "line-through text-muted" : ""}`}>
                  {habit.name}
                </span>
                {streak > 0 && (
                  <span className="text-xs text-warning font-medium">{streak}d streak</span>
                )}
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-muted hover:text-danger text-xs p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAddGoal(!showAddGoal)}
            className="w-full p-3 border-2 border-dashed border-card-border rounded-xl text-sm text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add Goal
          </button>

          {showAddGoal && (
            <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
              <input
                type="text"
                placeholder="Goal title..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                autoFocus
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Target"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. miles)"
                  value={newGoalUnit}
                  onChange={(e) => setNewGoalUnit(e.target.value)}
                  className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addGoal}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 text-muted text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 && !showAddGoal && (
            <div className="text-center py-8 text-muted text-sm">
              No goals set yet. Add one to track your progress.
            </div>
          )}

          {goals.map((goal) => {
            const progress = goal.targetValue > 0 ? goal.currentValue / goal.targetValue : 0;
            return (
              <div
                key={goal.id}
                className="bg-card border border-card-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-muted hover:text-danger text-xs p-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {goal.currentValue}/{goal.targetValue} {goal.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateGoalProgress(goal.id, goal.currentValue - 1)}
                    className="w-8 h-8 rounded-lg bg-card-border text-foreground flex items-center justify-center text-sm font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={goal.currentValue}
                    onChange={(e) => updateGoalProgress(goal.id, Number(e.target.value))}
                    className="w-20 text-center bg-transparent border border-card-border rounded-lg px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => updateGoalProgress(goal.id, goal.currentValue + 1)}
                    className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center text-sm font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
