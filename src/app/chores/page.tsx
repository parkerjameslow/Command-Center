"use client";

import { DomainPage } from "@/components/DomainPage";
import { useStore, today, type AppData } from "@/lib/store";
import { CompletedCard } from "@/components/CompletedCard";
import { Top3Suggestions } from "@/components/Top3Suggestions";
import { useMemo } from "react";

export default function ChoresPage() {
  const { data, loaded } = useStore();
  const todayStr = today();

  const suggestedChores = useMemo(() => generateHouseChores(data, todayStr), [data, todayStr]);

  if (!loaded) return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;

  const choreTasks = data.tasks.filter((t) => t.domain === "work");
  const completed = choreTasks.filter((t) => t.completed).length;
  const pending = choreTasks.filter((t) => !t.completed).length;
  const choreNudgesDone = data.nudges.filter((n) => (n.type === "chore" || n.type === "service") && n.completed).length;

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

      <Top3Suggestions
        title="Today's Top 3"
        subtitle="Highest-impact house tasks. Same 3 all day — fresh 3 tomorrow."
        suggestions={suggestedChores}
        domain="work"
        journalCategory="service"
      />

      <CompletedCard domain="work" />
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

// Exported for BottomNav + dashboard; `data` intentionally unused so that
// completing a chore (which mutates journalLogs/tasks) never regenerates
// the Top 3 titles. Same 3 all day; new 3 tomorrow.
export function generateHouseChores(_data: AppData, _todayStr: string): HouseChore[] {
  const chores: HouseChore[] = [];
  const dayIdx = dayOfYear();

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

  // Pick one from each category — deterministic per day, never shifts
  // within a day (so completing a chore doesn't replace it with a new one)
  const kitchenIdx = dayIdx % kitchenChores.length;
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

function _daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}
