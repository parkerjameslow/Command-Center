"use client";

import { DomainPage } from "@/components/DomainPage";
import { useStore, uid, today, type AppData } from "@/lib/store";
import { CompletedCard } from "@/components/CompletedCard";
import { useMemo, useState } from "react";

export default function ChoresPage() {
  const { data, loaded, update } = useStore();
  const todayStr = today();
  const [addModal, setAddModal] = useState<{ title: string } | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const suggestedChores = useMemo(() => generateHouseChores(data, todayStr), [data, todayStr]);

  if (!loaded) return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;

  const choreTasks = data.tasks.filter((t) => t.domain === "work");
  const completed = choreTasks.filter((t) => t.completed).length;
  const pending = choreTasks.filter((t) => !t.completed).length;
  const choreNudgesDone = data.nudges.filter((n) => (n.type === "chore" || n.type === "service") && n.completed).length;

  function completeChore(title: string) {
    update((d) => ({
      ...d,
      tasks: [...d.tasks, {
        id: uid(),
        title,
        domain: "work" as const,
        priority: "high" as const,
        completed: true,
        createdAt: new Date().toISOString(),
      }],
      journalLogs: [...(d.journalLogs || []), {
        id: uid(),
        date: todayStr,
        category: "service" as const,
        title: "Chore completed",
        content: title,
        mood: 4,
        createdAt: new Date().toISOString(),
      }],
    }));
  }

  function addChoreAsTask() {
    if (!addModal) return;
    update((d) => ({
      ...d,
      tasks: [...d.tasks, {
        id: uid(),
        title: addModal.title,
        domain: "work" as const,
        priority: "medium" as const,
        completed: false,
        dueDate: dueDate || undefined,
        createdAt: new Date().toISOString(),
      }],
    }));
    setAddModal(null);
    setDueDate("");
    setDueTime("");
  }

  return (
    <div>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-work" />
          <h1 className="text-xl font-bold">Chores</h1>
        </div>
        <p className="text-sm text-muted mb-4">House and outdoor tasks to keep things running</p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-foreground">{pending}</div>
            <div className="text-[9px] text-muted">Open</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-success">{completed}</div>
            <div className="text-[9px] text-muted">Done</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-accent">{choreNudgesDone}</div>
            <div className="text-[9px] text-muted">Nudges Done</div>
          </div>
        </div>
      </div>

      <DomainPage domain="work" title="" color="bg-work" description="" />

      <div className="max-w-lg mx-auto px-4 pb-6">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">Today&apos;s Top 3</h2>
          <p className="text-xs text-muted mb-3">Highest-impact house tasks based on your patterns.</p>
          <div className="space-y-2">
            {suggestedChores.map((chore, i) => (
              <div key={i} className={`border rounded-xl p-4 ${chore.bg}`}>
                <div className="text-[10px] text-muted uppercase font-semibold mb-1">{chore.category}</div>
                <p className="text-sm font-medium mb-1">{chore.title}</p>
                <p className="text-xs text-muted">{chore.why}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => completeChore(chore.title)}
                    className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setAddModal({ title: chore.title })}
                    className="px-3 py-1.5 bg-card border border-card-border rounded-lg text-xs font-medium text-muted"
                  >
                    Add to Tasks
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CompletedCard domain="work" />

      {/* Add to Tasks Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
          <div className="bg-background w-full max-w-lg rounded-t-2xl">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Add to Tasks</h2>
                <button onClick={() => { setAddModal(null); setDueDate(""); setDueTime(""); }} className="text-muted hover:text-foreground p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="bg-card border border-card-border rounded-xl p-3">
                <div className="text-sm">{addModal.title}</div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Due date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Due time (optional)</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
                />
              </div>

              <button
                onClick={addChoreAsTask}
                className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium"
              >
                Add to Chore List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- House/Outdoor Chore Generator ---

interface HouseChore {
  category: string;
  title: string;
  why: string;
  bg: string;
}

function generateHouseChores(data: AppData, todayStr: string): HouseChore[] {
  const chores: HouseChore[] = [];
  const dayIdx = dayOfYear();
  const serviceEntries = (data.journalLogs || []).filter((j) => (j.category === "service" || j.nudgeType === "chore") && daysBetween(j.date, todayStr) <= 14);

  // Pool of strictly house/outdoor chores
  const kitchenChores = [
    { title: "Do the dishes and wipe down all counters", why: "A clean kitchen sets the tone for the whole house." },
    { title: "Clean out the fridge — toss expired items, wipe shelves", why: "Nobody else is going to do this. Be the one." },
    { title: "Deep clean the stove and oven", why: "Grease builds up. 20 minutes and it's done." },
    { title: "Sweep and mop the kitchen floor", why: "The floor under your feet says a lot about the house." },
    { title: "Organize the pantry — group items, check expiry dates", why: "Reduces waste and makes cooking easier for everyone." },
  ];

  const bathroomChores = [
    { title: "Scrub all toilets and sinks", why: "The chore nobody wants. Handle it without being asked." },
    { title: "Clean the shower and bathtub", why: "Soap scum doesn't clean itself. 15 minutes." },
    { title: "Restock bathroom supplies — toilet paper, soap, towels", why: "Small prep prevents small frustrations." },
    { title: "Clean all bathroom mirrors", why: "Quick win. Takes 5 minutes and looks immediately better." },
  ];

  const outdoorChores = [
    { title: "Mow the lawn", why: "Curb appeal matters. Keep the yard sharp." },
    { title: "Take out all trash and recycling", why: "Simple. Unglamorous. Necessary." },
    { title: "Pull weeds or tidy up the garden beds", why: "10 minutes outside makes a visible difference." },
    { title: "Sweep the front porch and walkway", why: "First thing people see. Keep it clean." },
    { title: "Clean out the garage — one section at a time", why: "The 'I'll get to it' project. Start with one corner." },
    { title: "Wash the car inside and out", why: "The family vehicle deserves attention too." },
    { title: "Check and clean the gutters", why: "Preventative maintenance saves expensive repairs." },
  ];

  const generalChores = [
    { title: "Vacuum all floors and carpets", why: "The baseline of a clean house." },
    { title: "Do a full load of laundry — wash, dry, fold, put away", why: "The full cycle. Not leaving it in the dryer." },
    { title: "Dust all surfaces — shelves, fans, baseboards", why: "The stuff you don't see until it's done." },
    { title: "Fix that thing that's been broken the longest", why: "You know exactly what it is." },
    { title: "Change air filters and check smoke detectors", why: "Invisible maintenance that protects your family." },
    { title: "Organize one closet or storage area", why: "Clutter creates stress. Clear space, clear mind." },
    { title: "Tidy up the kids' rooms and play area", why: "Their spaces reflect how cared for they feel." },
    { title: "Clean all windows inside and out", why: "Natural light changes how a room feels." },
    { title: "Replace any burned-out lightbulbs", why: "Walk the house. Fix every dark corner." },
  ];

  // Pick one from each category based on day + history
  const kitchenIdx = (dayIdx + serviceEntries.length) % kitchenChores.length;
  const outdoorIdx = dayIdx % outdoorChores.length;
  const generalIdx = (dayIdx + 3) % generalChores.length;

  // Alternate bathroom/kitchen and vary the mix
  if (dayIdx % 2 === 0) {
    chores.push({ ...kitchenChores[kitchenIdx], category: "Kitchen", bg: "bg-work/5 border-work/20" });
  } else {
    const bathIdx = dayIdx % bathroomChores.length;
    chores.push({ ...bathroomChores[bathIdx], category: "Bathroom", bg: "bg-work/5 border-work/20" });
  }

  chores.push({ ...outdoorChores[outdoorIdx], category: "Outdoor", bg: "bg-growth/5 border-growth/20" });
  chores.push({ ...generalChores[generalIdx], category: "General", bg: "bg-personal/5 border-personal/20" });

  return chores;
}

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
