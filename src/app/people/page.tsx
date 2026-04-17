"use client";

import { useStore, uid, today } from "@/lib/store";
import { useState } from "react";
import type { Person } from "@/lib/store";

const RELATIONSHIPS = [
  { key: "wife", label: "Wife" },
  { key: "child", label: "Child" },
  { key: "parent", label: "Parent" },
  { key: "grandparent", label: "Grandparent" },
  { key: "sibling", label: "Sibling" },
  { key: "friend", label: "Friend" },
  { key: "other", label: "Other" },
] as const;

const FREQ_OPTIONS = [
  { days: 1, label: "Daily" },
  { days: 3, label: "Every few days" },
  { days: 7, label: "Weekly" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Monthly" },
];

export default function PeoplePage() {
  const { data, loaded, update } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<Person["relationship"]>("wife");
  const [frequency, setFrequency] = useState(7);

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }

  function addPerson() {
    if (!name.trim()) return;
    update((d) => ({
      ...d,
      people: [
        ...d.people,
        {
          id: uid(),
          name: name.trim(),
          relationship,
          contactFrequency: frequency,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setName("");
    setShowAdd(false);
  }

  function markContact(personId: string) {
    update((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.id === personId ? { ...p, lastContact: today() } : p
      ),
    }));
  }

  function deletePerson(personId: string) {
    update((d) => ({
      ...d,
      people: d.people.filter((p) => p.id !== personId),
    }));
  }

  function daysSince(date?: string): number | null {
    if (!date) return null;
    const d = new Date(date + "T00:00:00");
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  const grouped: Record<string, Person[]> = {};
  for (const p of data.people) {
    const key = p.relationship;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  const relationshipOrder = ["wife", "child", "parent", "grandparent", "sibling", "friend", "other"];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">My People</h1>
        <p className="text-sm text-muted">Track who matters most and stay connected</p>
      </div>

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full p-3 border-2 border-dashed border-card-border rounded-xl text-sm text-muted hover:border-accent hover:text-accent transition-colors"
      >
        + Add Person
      </button>

      {showAdd && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-card-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            autoFocus
          />
          <div>
            <div className="text-xs text-muted mb-2">Relationship</div>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRelationship(r.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    relationship === r.key
                      ? "bg-accent text-white"
                      : "bg-card-border text-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted mb-2">How often do you want to connect?</div>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f.days}
                  onClick={() => setFrequency(f.days)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    frequency === f.days
                      ? "bg-accent text-white"
                      : "bg-card-border text-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addPerson} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-muted text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {data.people.length === 0 && !showAdd && (
        <div className="text-center py-8 text-muted text-sm">
          Add the people who matter most. The app will remind you to stay connected.
        </div>
      )}

      {relationshipOrder
        .filter((r) => grouped[r]?.length)
        .map((rel) => (
          <section key={rel}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2 capitalize">{rel === "wife" ? "Wife" : rel === "child" ? "Kids" : rel + "s"}</h2>
            <div className="space-y-2">
              {grouped[rel].map((person) => {
                const days = daysSince(person.lastContact);
                const overdue = days !== null && days >= person.contactFrequency;
                return (
                  <div
                    key={person.id}
                    className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${
                      overdue ? "border-danger/30" : "border-card-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{person.name}</div>
                      <div className="text-[11px] text-muted">
                        {days !== null
                          ? days === 0
                            ? "Connected today"
                            : `${days}d ago`
                          : "Never connected"}
                        {" · every "}
                        {person.contactFrequency}d
                      </div>
                    </div>
                    <button
                      onClick={() => markContact(person.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        days === 0
                          ? "bg-success/20 text-success"
                          : "bg-accent text-white"
                      }`}
                    >
                      {days === 0 ? "✓" : "Connected"}
                    </button>
                    <button
                      onClick={() => deletePerson(person.id)}
                      className="text-muted hover:text-danger p-1"
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
          </section>
        ))}
    </div>
  );
}
