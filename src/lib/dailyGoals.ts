import type { AppData } from "./store";

export interface DailyGoal {
  id: string;
  title: string;
  category: "health" | "sleep" | "mind" | "body" | "connection" | "spirit";
  isDefault: boolean;
  why?: string;
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateDailyGoals(data: AppData, todayStr: string): DailyGoal[] {
  const goals: DailyGoal[] = [
    { id: "water-40oz", title: "Drink 40 oz of water", category: "health", isDefault: true },
    { id: "exercise-30min", title: "Exercise 30 minutes", category: "body", isDefault: true },
    { id: "bed-10pm", title: "Go to bed by 10 PM", category: "sleep", isDefault: true },
    { id: "wake-7am", title: "Wake up at 7 AM", category: "sleep", isDefault: true },
  ];

  // Data-driven additions (up to 4 more)
  const recentJournal = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 7);
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 3;
  const gratitudeCount = recentJournal.filter((j) => j.category === "gratitude").length;
  const lessonCount = recentJournal.filter((j) => j.category === "lesson").length;
  const serviceCount = recentJournal.filter((j) => j.category === "service").length;
  const winCount = recentJournal.filter((j) => j.category === "win").length;

  // Mindset/mood goal
  if (avgMood < 3) {
    goals.push({
      id: "meditate-10min",
      title: "Meditate or breathe deeply for 10 minutes",
      category: "mind",
      isDefault: false,
      why: "Your mood has been low this week — give your mind room to reset.",
    });
  }

  // Gratitude
  if (gratitudeCount < 3) {
    goals.push({
      id: "gratitude-1",
      title: "Log one gratitude entry",
      category: "spirit",
      isDefault: false,
      why: `Only ${gratitudeCount} gratitude ${gratitudeCount === 1 ? "entry" : "entries"} this week. Small reps compound.`,
    });
  }

  // Reading / learning
  if (lessonCount === 0) {
    goals.push({
      id: "read-20min",
      title: "Read for 20 minutes",
      category: "mind",
      isDefault: false,
      why: "No lessons logged recently — feed your mind something real.",
    });
  }

  // Family / connection
  const wife = data.people.find((p) => p.relationship === "wife");
  if (wife) {
    const days = wife.lastContact ? daysBetween(wife.lastContact, todayStr) : 999;
    if (days >= 1) {
      goals.push({
        id: "connect-wife",
        title: `Quality time with ${wife.name} today`,
        category: "connection",
        isDefault: false,
        why: days >= 2 ? `${days} days since real connection.` : "Daily intention beats occasional grand gestures.",
      });
    }
  }

  // Parents/grandparents overdue
  const overdueElder = data.people.find((p) => {
    if (p.relationship !== "parent" && p.relationship !== "grandparent") return false;
    const days = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
    return days >= p.contactFrequency;
  });
  if (overdueElder) {
    const days = overdueElder.lastContact ? daysBetween(overdueElder.lastContact, todayStr) : 999;
    goals.push({
      id: `call-${overdueElder.id}`,
      title: `Call ${overdueElder.name}`,
      category: "connection",
      isDefault: false,
      why: `${days} days since you talked. Pick up the phone.`,
    });
  }

  // Service if few service acts
  if (serviceCount < 2 && !goals.find((g) => g.id === "connect-wife")) {
    goals.push({
      id: "service-1",
      title: "Do one act of service (no announcement)",
      category: "connection",
      isDefault: false,
      why: `Only ${serviceCount} acts of service logged this week.`,
    });
  }

  // Wins tracking
  if (winCount === 0) {
    goals.push({
      id: "win-1",
      title: "Log one win from today",
      category: "mind",
      isDefault: false,
      why: "No wins logged this week — notice what's going right.",
    });
  }

  // Limit to 8 total max
  return goals.slice(0, 8);
}

export function isGoalCompletedToday(
  data: AppData,
  goalId: string,
  todayStr: string
): boolean {
  return (data.journalLogs || []).some(
    (j) => j.date === todayStr && j.nudgeType === "daily-goal" && j.content === goalId
  );
}

// Count of completed daily-goals on a given date (any goal id)
export function countCompletedOn(data: AppData, dateStr: string): number {
  const done = new Set<string>();
  for (const j of (data.journalLogs || [])) {
    if (j.date === dateStr && j.nudgeType === "daily-goal") {
      done.add(j.content);
    }
  }
  return done.size;
}

// Expected total of goals for a given date (we regenerate using today's data
// as an approximation — the default 4 are always there, suggestions may vary)
export function expectedTotalOn(data: AppData, dateStr: string): number {
  // Use 4 defaults as baseline; add count of dynamic suggestions based on
  // that day's context is complex, so just use the current generated total
  // as a reasonable estimate. For historical days we'll treat 4 as min.
  const current = generateDailyGoals(data, dateStr);
  return Math.max(4, current.length);
}

// Get dates for the current week (Sunday..Saturday)
export function getWeekDates(todayStr: string): string[] {
  const today = new Date(todayStr + "T00:00:00");
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// Month stats: days all-completed in the current calendar month
export function monthStats(data: AppData, todayStr: string): { daysPerfect: number; totalDays: number; daysAttempted: number } {
  const today = new Date(todayStr + "T00:00:00");
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const todayDay = today.getDate();

  let daysPerfect = 0;
  let daysAttempted = 0;
  for (let d = 1; d <= Math.min(todayDay, lastDay); d++) {
    const dateStr = new Date(year, month, d).toISOString().slice(0, 10);
    const done = countCompletedOn(data, dateStr);
    const total = expectedTotalOn(data, dateStr);
    if (done > 0) daysAttempted++;
    if (done >= total) daysPerfect++;
  }

  return { daysPerfect, totalDays: todayDay, daysAttempted };
}
