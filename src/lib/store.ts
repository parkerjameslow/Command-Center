"use client";

import { useState, useEffect, useCallback } from "react";
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

export interface AppData {
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  goals: Goal[];
  journal: JournalEntry[];
  familyEvents: FamilyEvent[];
  finance: FinanceEntry[];
}

const DEFAULT_DATA: AppData = {
  habits: [],
  habitLogs: [],
  tasks: [],
  goals: [],
  journal: [],
  familyEvents: [],
  finance: [],
};

// Snake_case <-> camelCase helpers for Supabase
function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
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
  const [habits, habitLogs, tasks, goals, journal, familyEvents, finance] =
    await Promise.all([
      supabase.from("habits").select("*").order("created_at"),
      supabase.from("habit_logs").select("*").order("date", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("goals").select("*").order("created_at"),
      supabase.from("journal").select("*").order("date", { ascending: false }),
      supabase.from("family_events").select("*").order("date"),
      supabase.from("finance").select("*").order("date", { ascending: false }),
    ]);

  return {
    habits: (habits.data ?? []).map((r) => toCamel(r) as unknown as Habit),
    habitLogs: (habitLogs.data ?? []).map((r) => toCamel(r) as unknown as HabitLog),
    tasks: (tasks.data ?? []).map((r) => toCamel(r) as unknown as Task),
    goals: (goals.data ?? []).map((r) => toCamel(r) as unknown as Goal),
    journal: (journal.data ?? []).map((r) => toCamel(r) as unknown as JournalEntry),
    familyEvents: (familyEvents.data ?? []).map((r) => toCamel(r) as unknown as FamilyEvent),
    finance: (finance.data ?? []).map((r) => toCamel(r) as unknown as FinanceEntry),
  };
}

export function useStore() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (useSupabase) {
      loadFromSupabase().then((d) => {
        setData(d);
        setLoaded(true);
      });
    } else {
      setData(loadLocal());
      setLoaded(true);
    }
  }, [useSupabase]);

  const update = useCallback(
    (updater: (prev: AppData) => AppData) => {
      setData((prev) => {
        const next = updater(prev);
        if (!useSupabase) {
          saveLocal(next);
        }
        return next;
      });
    },
    [useSupabase]
  );

  return { data, loaded, update, useSupabase };
}

// Supabase CRUD helpers
export const db = {
  async addHabit(habit: Omit<Habit, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("habits")
      .insert(toSnake({ ...habit, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as Habit;
  },

  async deleteHabit(id: string) {
    await supabase.from("habits").delete().eq("id", id);
  },

  async toggleHabitLog(habitId: string, date: string, completed: boolean) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: existing } = await supabase
      .from("habit_logs")
      .select("id")
      .eq("habit_id", habitId)
      .eq("date", date)
      .single();

    if (existing) {
      await supabase.from("habit_logs").update({ completed }).eq("id", existing.id);
    } else {
      await supabase
        .from("habit_logs")
        .insert({ habit_id: habitId, date, completed, user_id: userId });
    }
  },

  async addTask(task: Omit<Task, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("tasks")
      .insert(toSnake({ ...task, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as Task;
  },

  async updateTask(id: string, updates: Partial<Task>) {
    await supabase.from("tasks").update(toSnake(updates as Record<string, unknown>)).eq("id", id);
  },

  async deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
  },

  async addGoal(goal: Omit<Goal, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("goals")
      .insert(toSnake({ ...goal, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as Goal;
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    await supabase.from("goals").update(toSnake(updates as Record<string, unknown>)).eq("id", id);
  },

  async deleteGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
  },

  async addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("journal")
      .insert(toSnake({ ...entry, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as JournalEntry;
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>) {
    await supabase.from("journal").update(toSnake(updates as Record<string, unknown>)).eq("id", id);
  },

  async addFamilyEvent(event: Omit<FamilyEvent, "id">) {
    const { data, error } = await supabase
      .from("family_events")
      .insert(toSnake({ ...event, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as FamilyEvent;
  },

  async deleteFamilyEvent(id: string) {
    await supabase.from("family_events").delete().eq("id", id);
  },

  async addFinanceEntry(entry: Omit<FinanceEntry, "id">) {
    const { data, error } = await supabase
      .from("finance")
      .insert(toSnake({ ...entry, userId: (await supabase.auth.getUser()).data.user?.id }))
      .select()
      .single();
    if (error) throw error;
    return toCamel(data) as unknown as FinanceEntry;
  },

  async deleteFinanceEntry(id: string) {
    await supabase.from("finance").delete().eq("id", id);
  },
};

// Helper: generate unique ID (for localStorage mode)
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
