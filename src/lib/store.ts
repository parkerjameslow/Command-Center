"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// Types
export type Domain = "personal" | "family" | "work" | "growth" | "balance";

export interface Habit {
  id: string;
  name: string;
  domain: Domain;
  frequency: "daily" | "weekly";
  createdAt: string;
}

export interface HabitLog {
  id?: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  domain: Domain;
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  domain: Domain;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: "morning" | "evening" | "note";
  mood?: number;
  energy?: number;
  gratitude?: string[];
  wins?: string[];
  challenges?: string[];
  content?: string;
  aiResponse?: string;
  createdAt: string;
}

export interface FamilyEvent {
  id: string;
  title: string;
  person: string;
  date: string;
  time?: string;
  type: "sport" | "school" | "appointment" | "activity" | "other";
  notes?: string;
}

export interface FinanceEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface Person {
  id: string;
  name: string;
  relationship: "wife" | "child" | "parent" | "grandparent" | "sibling" | "friend" | "other";
  lastContact?: string; // YYYY-MM-DD
  contactFrequency: number; // desired days between contact
  notes?: string;
  createdAt: string;
}

export interface ConnectionLog {
  id: string;
  personId: string;
  date: string;
  type: "call" | "text" | "in-person" | "activity" | "gift" | "note";
  note?: string;
  mood?: number; // 1-5 how it went
  createdAt: string;
}

export interface Nudge {
  id: string;
  type: "relationship" | "chore" | "service" | "self" | "gratitude";
  message: string;
  personId?: string;
  completed: boolean;
  date: string;
  createdAt: string;
}

export interface AppData {
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  goals: Goal[];
  journal: JournalEntry[];
  familyEvents: FamilyEvent[];
  finance: FinanceEntry[];
  people: Person[];
  connectionLogs: ConnectionLog[];
  nudges: Nudge[];
}

const DEFAULT_DATA: AppData = {
  habits: [],
  habitLogs: [],
  tasks: [],
  goals: [],
  journal: [],
  familyEvents: [],
  finance: [],
  people: [],
  connectionLogs: [],
  nudges: [],
};

// Snake_case <-> camelCase helpers
function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function toSnake(obj: Record<string, unknown>, excludeKeys: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (excludeKeys.includes(k)) continue;
    if (k === "id") { out[k] = v; continue; }
    const snake = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    out[snake] = v;
  }
  return out;
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")
  );
}

// localStorage fallback
const STORAGE_KEY = "command-center-data";

function loadLocal(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveLocal(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Supabase loader
async function loadFromSupabase(): Promise<AppData> {
  const [habits, habitLogs, tasks, goals, journal, familyEvents, finance, people, connectionLogs, nudges] =
    await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("goals").select("*").order("created_at"),
      supabase.from("journal").select("*").order("date", { ascending: false }),
      supabase.from("family_events").select("*").order("date"),
      supabase.from("finance").select("*").order("date", { ascending: false }),
      supabase.from("people").select("*").order("created_at"),
      supabase.from("connection_logs").select("*").order("date", { ascending: false }),
      supabase.from("nudges").select("*").order("created_at"),
    ]);

  return {
    habits: (habits.data ?? []).map((r) => toCamel(r) as unknown as Habit),
    habitLogs: (habitLogs.data ?? []).map((r) => toCamel(r) as unknown as HabitLog),
    tasks: (tasks.data ?? []).map((r) => toCamel(r) as unknown as Task),
    goals: (goals.data ?? []).map((r) => toCamel(r) as unknown as Goal),
    journal: (journal.data ?? []).map((r) => toCamel(r) as unknown as JournalEntry),
    familyEvents: (familyEvents.data ?? []).map((r) => toCamel(r) as unknown as FamilyEvent),
    finance: (finance.data ?? []).map((r) => toCamel(r) as unknown as FinanceEntry),
    people: (people.data ?? []).map((r) => toCamel(r) as unknown as Person),
    connectionLogs: (connectionLogs.data ?? []).map((r) => toCamel(r) as unknown as ConnectionLog),
    nudges: (nudges.data ?? []).map((r) => toCamel(r) as unknown as Nudge),
  };
}

// Sync engine: detects diffs between prev and next state and persists to Supabase
async function syncToSupabase(prev: AppData, next: AppData) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;

  // Helper to convert supabase query builder to promise
  const run = (query: { then: (fn: (res: unknown) => void) => unknown }) =>
    new Promise<unknown>((resolve, reject) =>
      (query as { then: (fn: (r: unknown) => void, fn2: (e: unknown) => void) => void }).then(resolve, reject)
    );

  const promises: Promise<unknown>[] = [];

  // Helper: prepare insert data (exclude client id, let Supabase generate UUID)
  const forInsert = (obj: Record<string, unknown>) => {
    const snaked = toSnake(obj, ["id", "createdAt"]);
    snaked.user_id = userId;
    return snaked;
  };

  // Tasks
  const newTasks = next.tasks.filter((t) => !prev.tasks.find((p) => p.id === t.id));
  const deletedTasks = prev.tasks.filter((t) => !next.tasks.find((n) => n.id === t.id));
  const updatedTasks = next.tasks.filter((t) => {
    const old = prev.tasks.find((p) => p.id === t.id);
    return old && JSON.stringify(old) !== JSON.stringify(t);
  });
  for (const t of newTasks) {
    promises.push(run(supabase.from("tasks").insert(forInsert(t as unknown as Record<string, unknown>))));
  }
  for (const t of deletedTasks) {
    promises.push(run(supabase.from("tasks").delete().eq("id", t.id)));
  }
  for (const t of updatedTasks) {
    promises.push(run(supabase.from("tasks").update({ completed: t.completed, title: t.title, priority: t.priority }).eq("id", t.id)));
  }

  // Habits
  const newHabits = next.habits.filter((h) => !prev.habits.find((p) => p.id === h.id));
  const deletedHabits = prev.habits.filter((h) => !next.habits.find((n) => n.id === h.id));
  for (const h of newHabits) {
    promises.push(run(supabase.from("habits").insert(forInsert(h as unknown as Record<string, unknown>))));
  }
  for (const h of deletedHabits) {
    promises.push(run(supabase.from("habits").delete().eq("id", h.id)));
  }

  // Habit Logs
  const newLogs = next.habitLogs.filter(
    (l) => !prev.habitLogs.find((p) => p.habitId === l.habitId && p.date === l.date)
  );
  const updatedLogs = next.habitLogs.filter((l) => {
    const old = prev.habitLogs.find((p) => p.habitId === l.habitId && p.date === l.date);
    return old && old.completed !== l.completed;
  });
  for (const l of newLogs) {
    promises.push(run(supabase.from("habit_logs").insert({
      habit_id: l.habitId, date: l.date, completed: l.completed, user_id: userId,
    })));
  }
  for (const l of updatedLogs) {
    promises.push(run(supabase.from("habit_logs").update({ completed: l.completed }).eq("habit_id", l.habitId).eq("date", l.date)));
  }

  // Goals
  const newGoals = next.goals.filter((g) => !prev.goals.find((p) => p.id === g.id));
  const deletedGoals = prev.goals.filter((g) => !next.goals.find((n) => n.id === g.id));
  const updatedGoals = next.goals.filter((g) => {
    const old = prev.goals.find((p) => p.id === g.id);
    return old && JSON.stringify(old) !== JSON.stringify(g);
  });
  for (const g of newGoals) {
    promises.push(run(supabase.from("goals").insert(forInsert(g as unknown as Record<string, unknown>))));
  }
  for (const g of deletedGoals) {
    promises.push(run(supabase.from("goals").delete().eq("id", g.id)));
  }
  for (const g of updatedGoals) {
    promises.push(run(supabase.from("goals").update({ current_value: g.currentValue, target_value: g.targetValue, title: g.title }).eq("id", g.id)));
  }

  // Journal
  const newJournal = next.journal.filter((j) => !prev.journal.find((p) => p.id === j.id));
  for (const j of newJournal) {
    promises.push(run(supabase.from("journal").insert(forInsert(j as unknown as Record<string, unknown>))));
  }

  // Family Events
  const newEvents = next.familyEvents.filter((e) => !prev.familyEvents.find((p) => p.id === e.id));
  const deletedEvents = prev.familyEvents.filter((e) => !next.familyEvents.find((n) => n.id === e.id));
  for (const e of newEvents) {
    promises.push(run(supabase.from("family_events").insert(forInsert(e as unknown as Record<string, unknown>))));
  }
  for (const e of deletedEvents) {
    promises.push(run(supabase.from("family_events").delete().eq("id", e.id)));
  }

  // Finance
  const newFinance = next.finance.filter((f) => !prev.finance.find((p) => p.id === f.id));
  const deletedFinance = prev.finance.filter((f) => !next.finance.find((n) => n.id === f.id));
  for (const f of newFinance) {
    promises.push(run(supabase.from("finance").insert(forInsert(f as unknown as Record<string, unknown>))));
  }
  for (const f of deletedFinance) {
    promises.push(run(supabase.from("finance").delete().eq("id", f.id)));
  }

  // People
  const newPeople = next.people.filter((p) => !prev.people.find((pp) => pp.id === p.id));
  const deletedPeople = prev.people.filter((p) => !next.people.find((np) => np.id === p.id));
  const updatedPeople = next.people.filter((p) => {
    const old = prev.people.find((pp) => pp.id === p.id);
    return old && JSON.stringify(old) !== JSON.stringify(p);
  });
  for (const p of newPeople) {
    promises.push(run(supabase.from("people").insert(forInsert(p as unknown as Record<string, unknown>))));
  }
  for (const p of deletedPeople) {
    promises.push(run(supabase.from("people").delete().eq("id", p.id)));
  }
  for (const p of updatedPeople) {
    promises.push(run(supabase.from("people").update({ last_contact: p.lastContact, notes: p.notes, contact_frequency: p.contactFrequency }).eq("id", p.id)));
  }

  // Connection Logs
  const newConnLogs = next.connectionLogs.filter((c) => !prev.connectionLogs.find((pc) => pc.id === c.id));
  for (const c of newConnLogs) {
    promises.push(run(supabase.from("connection_logs").insert(forInsert(c as unknown as Record<string, unknown>))));
  }

  // Nudges
  const newNudges = next.nudges.filter((n) => !prev.nudges.find((pn) => pn.id === n.id));
  const updatedNudges = next.nudges.filter((n) => {
    const old = prev.nudges.find((pn) => pn.id === n.id);
    return old && old.completed !== n.completed;
  });
  for (const n of newNudges) {
    promises.push(run(supabase.from("nudges").insert(forInsert(n as unknown as Record<string, unknown>))));
  }
  for (const n of updatedNudges) {
    promises.push(run(supabase.from("nudges").update({ completed: n.completed }).eq("id", n.id)));
  }

  await Promise.all(promises);
}

export function useStore() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const useSupabase = isSupabaseConfigured();
  const prevRef = useRef<AppData>(DEFAULT_DATA);

  useEffect(() => {
    if (useSupabase) {
      loadFromSupabase().then((d) => {
        setData(d);
        prevRef.current = d;
        setLoaded(true);
      });
    } else {
      const d = loadLocal();
      setData(d);
      prevRef.current = d;
      setLoaded(true);
    }
  }, [useSupabase]);

  const update = useCallback(
    (updater: (prev: AppData) => AppData) => {
      setData((prev) => {
        const next = updater(prev);
        if (useSupabase) {
          // Sync diff to Supabase in background
          syncToSupabase(prev, next).catch(console.error);
        } else {
          saveLocal(next);
        }
        prevRef.current = next;
        return next;
      });
    },
    [useSupabase]
  );

  // Reload data from Supabase (call after navigation)
  const reload = useCallback(async () => {
    if (useSupabase) {
      const d = await loadFromSupabase();
      setData(d);
      prevRef.current = d;
    }
  }, [useSupabase]);

  return { data, loaded, update, reload, useSupabase };
}

// Helper: generate unique ID
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Helper: today's date string
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Helper: get streak count for a habit
export function getStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (habitLogs.length === 0) return 0;

  let streak = 0;
  const d = new Date();

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (habitLogs.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }

  return streak;
}
