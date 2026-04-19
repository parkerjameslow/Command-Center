"use client";

import { useStore, uid, today } from "@/lib/store";
import { selectThemeForDay, wasScriptureReadToday } from "@/lib/spiritual";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ScripturePage() {
  const { data, loaded, update } = useStore();
  const router = useRouter();
  const todayStr = today();
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);

  const theme = useMemo(() => selectThemeForDay(data, todayStr), [data, todayStr]);
  const alreadyRead = wasScriptureReadToday(data, todayStr);

  if (!loaded) return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;

  function markRead() {
    if (alreadyRead) {
      router.push("/");
      return;
    }
    update((d) => ({
      ...d,
      journalLogs: [...(d.journalLogs || []), {
        id: uid(),
        date: todayStr,
        category: "reflection" as const,
        title: `Scripture: ${theme.title}`,
        content: theme.id,
        nudgeType: "scripture-daily",
        mood: 4,
        createdAt: new Date().toISOString(),
      }],
    }));
    setSaved(true);
    setTimeout(() => router.push("/"), 600);
  }

  function saveReflection() {
    if (!reflection.trim()) return;
    update((d) => ({
      ...d,
      journalLogs: [...(d.journalLogs || []), {
        id: uid(),
        date: todayStr,
        category: "reflection" as const,
        title: `Reflection on ${theme.title}`,
        content: reflection.trim(),
        nudgeType: "scripture-reflection",
        mood: 4,
        createdAt: new Date().toISOString(),
      }],
    }));
    setReflection("");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <div className="text-xs text-muted uppercase tracking-wide font-semibold">Scripture of the Day</div>
          <h1 className="text-xl font-bold">{theme.title}</h1>
        </div>
      </div>

      <p className="text-sm text-muted italic">{theme.summary}</p>

      {/* Bible — KJV */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Bible (KJV)</div>
          <a
            href={theme.bible.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-accent hover:underline"
          >
            Read full chapter →
          </a>
        </div>
        <div className="text-sm font-semibold">{theme.bible.reference}</div>
        <p className="text-sm leading-relaxed text-muted">&ldquo;{theme.bible.text}&rdquo;</p>
      </section>

      {/* Book of Mormon */}
      <section className="bg-card border border-card-border rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">Book of Mormon</div>
          <a
            href={theme.bom.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-accent hover:underline"
          >
            Read full chapter →
          </a>
        </div>
        <div className="text-sm font-semibold">{theme.bom.reference}</div>
        <p className="text-sm leading-relaxed text-muted">&ldquo;{theme.bom.text}&rdquo;</p>
      </section>

      {/* Conference Talk */}
      <section className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-2">
        <div className="text-[10px] text-muted uppercase tracking-wide font-semibold">General Conference</div>
        <div className="text-sm font-semibold">{theme.talk.title}</div>
        <div className="text-xs text-muted">{theme.talk.speaker} · {theme.talk.year}</div>
        <a
          href={theme.talk.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium"
        >
          Read the talk →
        </a>
      </section>

      {/* Reflection */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Personal Reflection</h2>
        <textarea
          placeholder="What stood out to you? How does it apply to your life right now?"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          rows={4}
          className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
        />
        {reflection.trim() && (
          <button
            onClick={saveReflection}
            className="px-4 py-2 bg-card border border-card-border rounded-lg text-xs font-medium text-muted"
          >
            Save reflection to journal
          </button>
        )}
      </section>

      {/* Mark as read */}
      <button
        onClick={markRead}
        className={`w-full py-3 rounded-xl text-sm font-medium ${
          saved
            ? "bg-success text-white"
            : alreadyRead
            ? "bg-card border border-card-border text-muted"
            : "bg-accent text-white"
        }`}
      >
        {saved ? "✓ Marked as read" : alreadyRead ? "Already read today — Back to Dashboard" : "I've read this — Done for today"}
      </button>
    </div>
  );
}
