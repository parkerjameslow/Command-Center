"use client";

import { DomainPage } from "@/components/DomainPage";
import { useStore, uid } from "@/lib/store";
import { useState } from "react";
import Link from "next/link";

export default function FamilyPage() {
  return (
    <div>
      <DomainPage
        domain="family"
        title="Family"
        color="bg-family"
        description="Kids, wife, activities, and responsibilities"
      />
      <div className="max-w-lg mx-auto px-4 pb-4">
        <Link
          href="/people"
          className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-4 hover:border-family/30 transition-colors"
        >
          <span className="text-xl">❤️</span>
          <div>
            <div className="text-sm font-medium">My People</div>
            <div className="text-xs text-muted">Track relationships and stay connected</div>
          </div>
          <svg className="ml-auto text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
      <FamilyCalendar />
    </div>
  );
}

function FamilyCalendar() {
  const { data, loaded, update } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState<"sport" | "school" | "appointment" | "activity" | "other">("activity");

  if (!loaded) return null;

  const upcoming = data.familyEvents
    .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  function addEvent() {
    if (!title.trim() || !date) return;
    update((d) => ({
      ...d,
      familyEvents: [
        ...d.familyEvents,
        { id: uid(), title: title.trim(), person: person.trim(), date, time, type, notes: "" },
      ],
    }));
    setTitle("");
    setPerson("");
    setDate("");
    setTime("");
    setShowAdd(false);
  }

  function deleteEvent(id: string) {
    update((d) => ({
      ...d,
      familyEvents: d.familyEvents.filter((e) => e.id !== id),
    }));
  }

  const typeColors: Record<string, string> = {
    sport: "bg-success/20 text-success",
    school: "bg-work/20 text-work",
    appointment: "bg-danger/20 text-danger",
    activity: "bg-family/20 text-family",
    other: "bg-muted/20 text-muted",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-6 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Upcoming Events</h2>

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full p-3 border-2 border-dashed border-card-border rounded-xl text-sm text-muted hover:border-family hover:text-family transition-colors"
      >
        + Add Event
      </button>

      {showAdd && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-family"
            autoFocus
          />
          <input
            type="text"
            placeholder="Person (e.g. kid's name)"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-family"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-family"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-28 bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-family"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["sport", "school", "appointment", "activity", "other"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                  type === t ? typeColors[t] : "bg-card-border text-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addEvent} className="px-4 py-2 bg-family text-white rounded-lg text-sm font-medium">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {upcoming.length === 0 && !showAdd && (
        <div className="text-center py-6 text-muted text-sm">No upcoming events.</div>
      )}

      {upcoming.map((event) => (
        <div key={event.id} className="bg-card border border-card-border rounded-xl p-3 flex items-start gap-3">
          <div className="text-center flex-shrink-0 w-12">
            <div className="text-xs text-muted">
              {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
            </div>
            <div className="text-lg font-bold">
              {new Date(event.date + "T00:00:00").getDate()}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{event.title}</div>
            <div className="text-xs text-muted">
              {event.person && `${event.person} · `}
              {event.time || "All day"}
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>
            {event.type}
          </span>
          <button onClick={() => deleteEvent(event.id)} className="text-muted hover:text-danger p-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
