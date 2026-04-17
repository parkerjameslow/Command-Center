"use client";

import { DomainPage } from "@/components/DomainPage";
import { useStore, uid, today, type AppData } from "@/lib/store";
import { useMemo } from "react";

export default function ChoresPage() {
  const { data, loaded, update } = useStore();
  const todayStr = today();

  const suggestedChores = useMemo(() => generateSmartChores(data, todayStr), [data, todayStr]);

  if (!loaded) return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;

  const choreTasks = data.tasks.filter((t) => t.domain === "work");
  const completed = choreTasks.filter((t) => t.completed).length;
  const pending = choreTasks.filter((t) => !t.completed).length;
  const choreNudgesDone = data.nudges.filter((n) => (n.type === "chore" || n.type === "service") && n.completed).length;
  const choreJournalLogs = (data.journalLogs || []).filter((j) => j.category === "service" || j.nudgeType === "chore").length;

  function addChoreAsTask(title: string) {
    update((d) => ({
      ...d,
      tasks: [...d.tasks, {
        id: uid(),
        title,
        domain: "work" as const,
        priority: "high" as const,
        completed: false,
        createdAt: new Date().toISOString(),
      }],
    }));
  }

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

  return (
    <div>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-work" />
          <h1 className="text-xl font-bold">Chores</h1>
        </div>
        <p className="text-sm text-muted mb-4">High-impact actions for your family today</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
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
            <div className="text-[9px] text-muted">Nudges</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-warning">{choreJournalLogs}</div>
            <div className="text-[9px] text-muted">Logged</div>
          </div>
        </div>

        {/* Smart Suggested Chores */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">Today&apos;s Top 3</h2>
          <p className="text-xs text-muted mb-3">Based on your patterns, connections, and what will have the biggest impact right now.</p>
          <div className="space-y-2">
            {suggestedChores.map((chore, i) => (
              <div key={i} className={`border rounded-xl p-4 ${chore.bg}`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{chore.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase text-muted mb-1">{chore.category}</div>
                    <p className="text-sm font-medium mb-1">{chore.title}</p>
                    <p className="text-xs text-muted">{chore.why}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pl-8">
                  <button
                    onClick={() => completeChore(chore.title)}
                    className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-medium"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => addChoreAsTask(chore.title)}
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

      <DomainPage
        domain="work"
        title=""
        color="bg-work"
        description=""
      />
    </div>
  );
}

// --- Smart Chore Generator ---

interface SmartChore {
  icon: string;
  category: string;
  title: string;
  why: string;
  bg: string;
}

function generateSmartChores(data: AppData, todayStr: string): SmartChore[] {
  const chores: SmartChore[] = [];
  const dayIdx = dayOfYear();
  const wife = data.people.find((p) => p.relationship === "wife");
  const kids = data.people.filter((p) => p.relationship === "child");

  // Analyze patterns
  const recentJournal = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 14);
  const serviceEntries = recentJournal.filter((j) => j.category === "service");
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 3;
  const recentConnections = (data.connectionLogs || []).filter((c) => daysBetween(c.date, todayStr) <= 7);
  const lowQualityConnections = recentConnections.filter((c) => c.mood && c.mood <= 3);

  // --- CHORE 1: For your wife ---
  if (wife) {
    const wifeChores = [
      { title: "Handle the dishes and clean the kitchen tonight", why: `${wife.name} shouldn't have to ask. Just do it.`, icon: "🍽️" },
      { title: "Do a load of laundry — wash, dry, fold, put away", why: "The full cycle. Not leaving it in the dryer.", icon: "👕" },
      { title: "Take over bedtime routine for all the kids tonight", why: `Give ${wife.name} an evening off. She deserves the break.`, icon: "🌙" },
      { title: "Clean the bathrooms without being asked", why: "This is the chore nobody wants. Be the one who handles it.", icon: "🧹" },
      { title: "Meal prep or cook dinner tonight", why: `Taking this off ${wife.name}'s plate shows you see the invisible work.`, icon: "🍳" },
      { title: "Organize one messy area she's mentioned", why: "She's probably mentioned it more than once. Handle it today.", icon: "📦" },
      { title: "Handle the grocery list and shopping", why: "One less thing for her to think about. That's the real gift.", icon: "🛒" },
    ];

    const choreIdx = lowQualityConnections.length > 0
      ? (dayIdx + lowQualityConnections.length) % wifeChores.length
      : dayIdx % wifeChores.length;

    chores.push({
      ...wifeChores[choreIdx],
      category: `For ${wife.name}`,
      bg: "bg-family/5 border-family/20",
    });
  }

  // --- CHORE 2: For the kids / home ---
  if (kids.length > 0) {
    const kidChores = [
      { title: `Organize ${kids[dayIdx % kids.length].name}'s room or play area`, why: "Their spaces reflect how cared for they feel.", icon: "🧸" },
      { title: "Check school bags, lunch boxes, and supplies", why: "The small prep work prevents the morning chaos.", icon: "🎒" },
      { title: `Set up a fun activity for ${kids[dayIdx % kids.length].name}`, why: "Not screens — something you do together.", icon: "🎨" },
      { title: "Fix something in the kids' spaces that's broken", why: "That thing you keep walking past? Today's the day.", icon: "🔧" },
      { title: "Clean out the car — crumbs, trash, old stuff", why: "It's the family vehicle. Make it feel fresh.", icon: "🚗" },
    ];

    chores.push({
      ...kidChores[dayIdx % kidChores.length],
      category: "Kids & Home",
      bg: "bg-personal/5 border-personal/20",
    });
  } else {
    const homeChores = [
      { title: "Fix the thing that's been broken the longest", why: "You know exactly what it is.", icon: "🔧" },
      { title: "Deep clean one room — floors, surfaces, everything", why: "One room done right changes the whole feel.", icon: "✨" },
      { title: "Tackle the garage, closet, or storage area", why: "The 'I'll get to it' area. Get to it.", icon: "📦" },
    ];
    chores.push({
      ...homeChores[dayIdx % homeChores.length],
      category: "Home",
      bg: "bg-personal/5 border-personal/20",
    });
  }

  // --- CHORE 3: Proactive / unexpected ---
  const proactiveChores = [
    { title: "Check all lightbulbs, smoke detectors, and filters", why: "The invisible maintenance that protects your family.", icon: "💡", category: "Maintenance" },
    { title: "Write a note and leave it somewhere she'll find it", why: "Not a text — a handwritten note. It hits different.", icon: "✉️", category: "Thoughtful" },
    { title: "Plan a family activity for this weekend", why: "Don't wait to be asked. Take the lead on quality time.", icon: "📅", category: "Planning" },
    { title: "Take out all the trash and recycling", why: "Simple. Unglamorous. Necessary. Just do it.", icon: "🗑️", category: "Quick Win" },
    avgMood < 3
      ? { title: "Do something that makes the house feel peaceful", why: "When you're running low, create calm for the people around you.", icon: "🕯️", category: "Atmosphere" }
      : { title: "Surprise the family with something fun tonight", why: "You're in a good headspace. Share that energy.", icon: "🎉", category: "Surprise" },
    serviceEntries.length === 0
      ? { title: "Ask your wife: what's the one thing I can do today?", why: "You haven't logged a service act recently. Start by asking.", icon: "❓", category: "Ask" }
      : { title: "Do something kind without anyone knowing", why: `You've done ${serviceEntries.length} acts of service recently. Keep building.`, icon: "🤫", category: "Stealth" },
  ];

  chores.push({
    ...proactiveChores[dayIdx % proactiveChores.length],
    bg: "bg-growth/5 border-growth/20",
  });

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
