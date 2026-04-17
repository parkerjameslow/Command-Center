"use client";

import { useState, useEffect, useCallback } from "react";

// Types
export interface Habit {
  id: string;
  name: string;
  domain: "personal" | "family" | "work" | "growth" | "balance";
  frequency: "daily" | "weekly";
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  domain: "personal" | "family" | "work" | "growth" | "balance";
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  domain: "personal" | "family" | "work" | "growth" | "balance";
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
  mood?: number; // 1-5
  energy?: number; // 1-5
  gratitude?: string[];
  wins?: string[];
  challenges?: string[];
  content?: string;
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

const STORAGE_KEY = "command-center-data";

function loadData(): AppData {
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DATA;
  }
}

function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStore() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  return { data, loaded, update };
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
