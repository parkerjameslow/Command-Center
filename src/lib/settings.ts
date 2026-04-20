import type { AppData } from "./store";

export interface UserSettings {
  scriptureEnabled: boolean;
  onboardingCompleted: boolean;
  welcomeSeen: boolean;
  displayName?: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  scriptureEnabled: true,
  onboardingCompleted: false,
  welcomeSeen: false,
};

const SETTINGS_MARKER = "user-settings";

export function getSettings(data: AppData): UserSettings {
  const logs = (data.journalLogs || []).filter((j) => j.nudgeType === SETTINGS_MARKER);
  // Use the most recent settings log (by createdAt)
  logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = logs[0];
  if (!latest) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(latest.content) as Partial<UserSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Build a new journalLog row representing settings. Caller calls update()
// with this to persist. Drops previous settings rows to keep the table clean.
export function applySettings(
  prev: AppData,
  next: UserSettings,
  uidFn: () => string,
  todayStr: string,
): AppData {
  const withoutOld = (prev.journalLogs || []).filter((j) => j.nudgeType !== SETTINGS_MARKER);
  return {
    ...prev,
    journalLogs: [
      ...withoutOld,
      {
        id: uidFn(),
        date: todayStr,
        category: "reflection" as const,
        title: "Settings",
        content: JSON.stringify(next),
        nudgeType: SETTINGS_MARKER,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

// Heuristic: a user is "new" if they have almost no activity data
export function isNewUser(data: AppData): boolean {
  const signalCount =
    data.habits.length +
    data.tasks.length +
    data.goals.length +
    data.people.length +
    (data.journalLogs || []).filter((j) => j.nudgeType !== SETTINGS_MARKER).length +
    data.journal.length +
    data.connectionLogs.length;
  return signalCount < 3;
}
