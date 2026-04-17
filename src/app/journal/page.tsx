"use client";

import { useStore, uid, today } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_INFO: Record<string, { icon: string; label: string; color: string }> = {
  gratitude: { icon: "✨", label: "Gratitude", color: "bg-warning/10 border-warning/20" },
  connection: { icon: "💬", label: "Connection", color: "bg-family/10 border-family/20" },
  service: { icon: "❤️", label: "Service", color: "bg-personal/10 border-personal/20" },
  reflection: { icon: "🧠", label: "Reflection", color: "bg-growth/10 border-growth/20" },
  win: { icon: "🏆", label: "Win", color: "bg-success/10 border-success/20" },
  lesson: { icon: "📖", label: "Lesson", color: "bg-accent/10 border-accent/20" },
  nudge: { icon: "💡", label: "Nudge", color: "bg-work/10 border-work/20" },
};

const QUICK_ADD_CATEGORIES = [
  { key: "gratitude", label: "Gratitude", placeholder: "What are you grateful for right now?" },
  { key: "win", label: "Win", placeholder: "What went well? What are you proud of?" },
  { key: "lesson", label: "Lesson", placeholder: "What did you learn today?" },
  { key: "reflection", label: "Reflection", placeholder: "What's on your mind?" },
] as const;

export default function JournalPage() {
  const { data, loaded, update } = useStore();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [addCategory, setAddCategory] = useState("gratitude");
  const [addContent, setAddContent] = useState("");
  const [addMood, setAddMood] = useState(4);
  const todayStr = today();

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  // Combine journal logs + morning/evening check-ins into unified timeline
  type TimelineEntry = {
    id: string;
    date: string;
    category: string;
    title: string;
    content: string;
    mood?: number;
    personName?: string;
    time: string;
  };

  const timeline: TimelineEntry[] = [];

  // Add journal logs (exclude midday check-in entries)
  for (const log of data.journalLogs) {
    if (log.nudgeType === "midday-checkin") continue;
    const person = log.relatedPersonId
      ? data.people.find((p) => p.id === log.relatedPersonId)
      : null;
    timeline.push({
      id: log.id,
      date: log.date,
      category: log.category,
      title: log.title,
      content: log.content,
      mood: log.mood,
      personName: person?.name,
      time: log.createdAt,
    });
  }

  // Skip morning/midday/evening check-ins — those are surveys, not journal entries

  // Add connection logs
  for (const log of data.connectionLogs) {
    const person = data.people.find((p) => p.id === log.personId);
    if (log.note) {
      timeline.push({
        id: log.id,
        date: log.date,
        category: "connection",
        title: `${log.type} with ${person?.name || "someone"}`,
        content: log.note,
        mood: log.mood,
        personName: person?.name,
        time: log.createdAt,
      });
    }
  }

  // Sort by date descending, then time descending
  timeline.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.time.localeCompare(a.time);
  });

  // Group by date
  const grouped: Record<string, TimelineEntry[]> = {};
  for (const entry of timeline) {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  }

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Stats
  const thisWeek = timeline.filter((e) => daysBetween(e.date, todayStr) <= 7).length;
  const streak = getJournalStreak(dates, todayStr);

  function addEntry() {
    if (!addContent.trim()) return;
    const cat = QUICK_ADD_CATEGORIES.find((c) => c.key === addCategory);
    update((d) => ({
      ...d,
      journalLogs: [
        ...d.journalLogs,
        {
          id: uid(),
          date: todayStr,
          category: addCategory as "gratitude" | "win" | "lesson" | "reflection",
          title: cat?.label || addCategory,
          content: addContent.trim(),
          mood: addMood,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setAddContent("");
    setShowAdd(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">Journal</h1>
          <p className="text-sm text-muted">Your growth story, one day at a time</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-accent">{timeline.length}</div>
          <div className="text-[10px] text-muted">Total Entries</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-success">{thisWeek}</div>
          <div className="text-[10px] text-muted">This Week</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-warning">{streak}d</div>
          <div className="text-[10px] text-muted">Streak</div>
        </div>
      </div>

      {/* Quick Add */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
      >
        + New Entry
      </button>

      {showAdd && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setAddCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  addCategory === cat.key ? "bg-accent text-white" : "bg-card-border text-muted"
                }`}
              >
                {CATEGORY_INFO[cat.key]?.icon} {cat.label}
              </button>
            ))}
          </div>

          <textarea
            placeholder={QUICK_ADD_CATEGORIES.find((c) => c.key === addCategory)?.placeholder}
            value={addContent}
            onChange={(e) => setAddContent(e.target.value)}
            rows={4}
            className="w-full bg-transparent border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
            autoFocus
          />

          <div>
            <div className="text-xs text-muted mb-2">How are you feeling?</div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setAddMood(n)}
                  className={`w-10 h-10 rounded-full text-sm flex items-center justify-center ${
                    addMood === n ? "bg-accent text-white scale-110" : "bg-card-border"
                  }`}
                >
                  {["😞", "😕", "😐", "🙂", "😄"][n - 1]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={addEntry} disabled={!addContent.trim()} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {dates.length === 0 && !showAdd && (
        <div className="text-center py-8 text-muted text-sm">
          Your journal is empty. Complete a nudge, do a check-in, or add an entry to start building your story.
        </div>
      )}

      {dates.map((date) => (
        <div key={date}>
          <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            {formatDateHeader(date, todayStr)}
          </div>
          <div className="space-y-2">
            {grouped[date].map((entry) => {
              const info = CATEGORY_INFO[entry.category] || CATEGORY_INFO.reflection;
              const timestamp = formatTime(entry.time);
              return (
                <div key={entry.id} className={`border rounded-xl p-3 ${info.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium capitalize">{entry.title}</span>
                    <span className="text-[10px] text-muted">{timestamp}</span>
                  </div>
                  <p className="text-sm text-muted whitespace-pre-wrap">{entry.content}</p>
                  {entry.personName && (
                    <div className="text-[10px] text-muted mt-1">About: {entry.personName}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getJournalStreak(dates: string[], todayStr: string): number {
  const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const d = new Date(todayStr + "T00:00:00");

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (uniqueDates.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function formatDateHeader(date: string, todayStr: string): string {
  const diff = daysBetween(date, todayStr);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}
