"use client";

import { useStore, uid, today, type ConnectionLog } from "@/lib/store";
import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";

const CONNECTION_TYPES = [
  { key: "call", label: "Called" },
  { key: "text", label: "Texted" },
  { key: "in-person", label: "In Person" },
  { key: "activity", label: "Activity" },
  { key: "gift", label: "Gift/Surprise" },
  { key: "note", label: "Note/Letter" },
] as const;

export default function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loaded, update } = useStore();
  const router = useRouter();
  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState<ConnectionLog["type"]>("in-person");
  const [logNote, setLogNote] = useState("");
  const [logMood, setLogMood] = useState(4);

  const person = data.people.find((p) => p.id === id);
  const logs = useMemo(
    () => data.connectionLogs
      .filter((l) => l.personId === id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.connectionLogs, id]
  );

  const todayStr = today();

  // Insights computed from data
  const insights = useMemo(() => {
    if (!person) return null;
    return computeInsights(person, logs, data, todayStr);
  }, [person, logs, data, todayStr]);

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  if (!person) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-muted">Person not found.</p>
        <button onClick={() => router.push("/people")} className="mt-4 text-accent text-sm">Go back</button>
      </div>
    );
  }

  const daysSince = person.lastContact
    ? Math.floor((new Date(todayStr + "T00:00:00").getTime() - new Date(person.lastContact + "T00:00:00").getTime()) / 86400000)
    : null;

  function addConnectionLog() {
    update((d) => ({
      ...d,
      connectionLogs: [
        ...d.connectionLogs,
        {
          id: uid(),
          personId: id,
          date: todayStr,
          type: logType,
          note: logNote.trim() || undefined,
          mood: logMood,
          createdAt: new Date().toISOString(),
        },
      ],
      people: d.people.map((p) =>
        p.id === id ? { ...p, lastContact: todayStr } : p
      ),
    }));
    setLogNote("");
    setShowLog(false);
  }

  // Avg mood from connection logs
  const avgConnectionMood = logs.length > 0
    ? logs.filter((l) => l.mood).reduce((sum, l) => sum + (l.mood || 0), 0) / logs.filter((l) => l.mood).length
    : null;

  // Most common connection type
  const typeCounts: Record<string, number> = {};
  for (const l of logs) typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  // Connection frequency (actual vs desired)
  const last30 = logs.filter((l) => daysBetween(l.date, todayStr) <= 30).length;

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
          <h1 className="text-xl font-bold">{person.name}</h1>
          <p className="text-sm text-muted capitalize">{person.relationship}</p>
        </div>
      </div>

      {/* Status card */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className={`text-lg font-bold ${daysSince === null ? "text-muted" : daysSince === 0 ? "text-success" : daysSince >= person.contactFrequency ? "text-danger" : "text-foreground"}`}>
              {daysSince === null ? "—" : daysSince === 0 ? "Today" : `${daysSince}d`}
            </div>
            <div className="text-[10px] text-muted">Last contact</div>
          </div>
          <div>
            <div className="text-lg font-bold">{last30}</div>
            <div className="text-[10px] text-muted">This month</div>
          </div>
          <div>
            <div className="text-lg font-bold">{avgConnectionMood ? avgConnectionMood.toFixed(1) : "—"}</div>
            <div className="text-[10px] text-muted">Avg quality</div>
          </div>
        </div>
        {topType && (
          <div className="text-xs text-muted text-center">
            Most common: <span className="text-foreground">{topType[0]}</span> ({topType[1]} times)
          </div>
        )}
      </div>

      {/* Log a connection */}
      <button
        onClick={() => setShowLog(!showLog)}
        className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
      >
        Log a Connection
      </button>

      {showLog && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-4">
          <div>
            <div className="text-xs text-muted mb-2">How did you connect?</div>
            <div className="grid grid-cols-3 gap-2">
              {CONNECTION_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setLogType(t.key)}
                  className={`p-2 rounded-lg text-center text-xs ${
                    logType === t.key ? "bg-accent text-white" : "bg-card-border text-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted mb-2">How did it go?</div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setLogMood(n)}
                  className={`w-10 h-10 rounded-full text-sm font-bold flex items-center justify-center ${
                    logMood === n ? "bg-accent text-white scale-110" : "bg-card-border text-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="What did you talk about? How are they doing?"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            rows={3}
            className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent resize-none"
          />

          <div className="flex gap-2">
            <button onClick={addConnectionLog} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">
              Save
            </button>
            <button onClick={() => setShowLog(false)} className="px-4 py-2 text-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Daily Insight */}
      {insights && insights.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Insights</h2>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`border rounded-xl p-3 ${insight.bg}`}>
                <div className="text-xs font-semibold text-muted uppercase mb-1">{insight.label}</div>
                <p className="text-sm leading-relaxed">{insight.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Connection History */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
          Connection History
          {logs.length > 0 && <span className="ml-1 normal-case">({logs.length})</span>}
        </h2>
        {logs.length === 0 && (
          <div className="text-center py-6 text-muted text-sm">
            No connections logged yet. Tap &quot;Log a Connection&quot; after you reach out.
          </div>
        )}
        <div className="space-y-2">
          {logs.slice(0, 20).map((log) => {
            return (
              <div key={log.id} className="bg-card border border-card-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium capitalize">{log.type}</span>
                  <span className="text-[10px] text-muted ml-auto">
                    {formatDate(log.date)}
                  </span>
                </div>
                {log.note && (
                  <p className="text-xs text-muted mt-1 pl-6">{log.note}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// --- Insight Engine ---

interface Insight {
  label: string;
  message: string;
  bg: string;
}

function computeInsights(
  person: ReturnType<typeof import("@/lib/store").useStore>["data"]["people"][0],
  logs: ConnectionLog[],
  data: ReturnType<typeof import("@/lib/store").useStore>["data"],
  todayStr: string
): Insight[] {
  const insights: Insight[] = [];
  const { name, relationship } = person;
  const daysSince = person.lastContact ? daysBetween(person.lastContact, todayStr) : 999;

  // Recent journals for mood context
  const recentJournals = data.journal.filter((j) => daysBetween(j.date, todayStr) <= 7);
  const avgMood = recentJournals.filter((j) => j.mood).reduce((s, j) => s + j.mood!, 0) / (recentJournals.filter((j) => j.mood).length || 1);

  // Connection quality trend
  const recentLogs = logs.filter((l) => daysBetween(l.date, todayStr) <= 30);
  const recentMoods = recentLogs.filter((l) => l.mood).map((l) => l.mood!);
  const olderLogs = logs.filter((l) => daysBetween(l.date, todayStr) > 30 && daysBetween(l.date, todayStr) <= 60);
  const olderMoods = olderLogs.filter((l) => l.mood).map((l) => l.mood!);

  if (recentMoods.length >= 3 && olderMoods.length >= 3) {
    const recentAvg = recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((a, b) => a + b, 0) / olderMoods.length;
    if (recentAvg < olderAvg - 0.5) {
      insights.push({
        label: "Trend",
        message: `Your connection quality with ${name} has been declining. The average went from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)}. Consider changing how you're connecting — maybe more in-person time.`,
        bg: "bg-danger/5 border-danger/20",
      });
    } else if (recentAvg > olderAvg + 0.5) {
      insights.push({
        label: "Trend",
        message: `Things are trending up with ${name}. Quality went from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)}. Whatever you're doing, keep doing it.`,
        bg: "bg-success/5 border-success/20",
      });
    }
  }

  // Variety insight
  const types = new Set(recentLogs.map((l) => l.type));
  if (recentLogs.length >= 5 && types.size <= 1) {
    insights.push({
      label: "Variety",
      message: `You've only been connecting via ${[...types][0]}. Try mixing it up — an unexpected call, a handwritten note, or quality time doing something together.`,
      bg: "bg-warning/5 border-warning/20",
    });
  }

  // Relationship-specific daily insight
  const dayIdx = dayOfYear();

  if (relationship === "wife") {
    const wifeInsights = [
      { label: "Today", message: `What's the most important thing happening in ${name}'s world right now? If you don't know, that's the problem.`, bg: "bg-family/5 border-family/20" },
      { label: "Challenge", message: `When's the last time you dated ${name}? Not dinner-and-a-movie routine. Something that shows thought and effort.`, bg: "bg-accent/5 border-accent/20" },
      { label: "Reflection", message: `If ${name} described you to her closest friend right now, what would she say? Would you be proud of that description?`, bg: "bg-personal/5 border-personal/20" },
      { label: "Action", message: `Her love language might not be yours. Think about what makes HER feel loved — words, acts, time, touch, gifts. Do that thing today.`, bg: "bg-growth/5 border-growth/20" },
      { label: "Quick win", message: `Handle something she normally handles. Don't announce it. Don't wait for credit. Just do it.`, bg: "bg-success/5 border-success/20" },
      { label: "Connect", message: `Ask ${name}: "What's one thing I could do this week that would really help you?" Then do it.`, bg: "bg-family/5 border-family/20" },
      { label: "Presence", message: `Tonight: phones down, TV off, 20 minutes. Ask about her dreams, her fears, what she's excited about. Be curious about the woman you married.`, bg: "bg-danger/5 border-danger/20" },
    ];
    insights.push(wifeInsights[dayIdx % wifeInsights.length]);

    if (avgMood < 3) {
      insights.push({
        label: "Your state",
        message: `You've been running low this week. ${name} can probably feel it. Don't withdraw — let her in. Vulnerability isn't weakness, it's trust.`,
        bg: "bg-personal/5 border-personal/20",
      });
    }
  }

  if (relationship === "child") {
    const kidInsights = [
      { label: "Today", message: `Kids spell love T-I-M-E. Give ${name} 15 minutes of fully undivided attention today.`, bg: "bg-family/5 border-family/20" },
      { label: "Growth", message: `What's ${name} struggling with right now? Not academically — emotionally. Do they feel safe telling you the hard things?`, bg: "bg-growth/5 border-growth/20" },
      { label: "Encourage", message: `Catch ${name} doing something right today. Be specific about what you noticed and why it matters.`, bg: "bg-success/5 border-success/20" },
      { label: "Their world", message: `Enter ${name}'s world today. What are they into? Play their game, watch their show, learn their thing. It tells them their world matters to you.`, bg: "bg-accent/5 border-accent/20" },
      { label: "Safety", message: `Does ${name} know they can fail and you'll still be there? Make sure they know your love isn't performance-based.`, bg: "bg-personal/5 border-personal/20" },
      { label: "Story", message: `Tell ${name} a story about when you were their age. Kids need to know you were once figuring it out too.`, bg: "bg-warning/5 border-warning/20" },
      { label: "Question", message: `Instead of "How was school?" try "What made you laugh today?" or "What was the hardest part of your day?"`, bg: "bg-family/5 border-family/20" },
    ];
    insights.push(kidInsights[dayIdx % kidInsights.length]);
  }

  if (relationship === "parent" || relationship === "grandparent") {
    insights.push({
      label: "Perspective",
      message: daysSince >= 14
        ? `${daysSince} days since you connected with ${name}. Every day you have with them is a gift you won't always have. Pick up the phone.`
        : `You're staying connected with ${name}. Ask them to tell you a story you haven't heard before. Their memories are treasures.`,
      bg: daysSince >= 14 ? "bg-danger/5 border-danger/20" : "bg-success/5 border-success/20",
    });
  }

  // Frequency insight
  if (recentLogs.length === 0 && logs.length > 0) {
    insights.push({
      label: "Pattern",
      message: `You haven't connected with ${name} at all in the last 30 days. Before that, you were averaging ${olderLogs.length} connections per month. Something shifted — was it intentional?`,
      bg: "bg-danger/5 border-danger/20",
    });
  }

  return insights;
}

// --- Helpers ---

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
