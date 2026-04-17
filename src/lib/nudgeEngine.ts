import type { AppData, Nudge, Person } from "./store";

type TimePhase = "morning" | "midday" | "evening";

function getPhase(hour: number): TimePhase {
  if (hour < 13) return "morning";
  if (hour < 18) return "midday";
  return "evening";
}

export function generateNudges(data: AppData, todayStr: string): Nudge[] {
  const nudges: Nudge[] = [];
  const hour = new Date().getHours();
  const phase = getPhase(hour);
  const dayIdx = dayOfYear();

  // Historical context
  const journalLogs = data.journalLogs || [];
  const recentJournal = journalLogs.filter((j) => daysBetween(j.date, todayStr) <= 14);
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 3;
  const avgEnergy = (() => {
    const e = data.journal.filter((j) => j.energy && daysBetween(j.date, todayStr) <= 7).map((j) => j.energy!);
    return e.length > 0 ? e.reduce((a, b) => a + b, 0) / e.length : 3;
  })();

  // Connection history
  const connectionLogs = data.connectionLogs || [];
  const recentConnections = connectionLogs.filter((c) => daysBetween(c.date, todayStr) <= 14);
  const serviceEntries = recentJournal.filter((j) => j.category === "service");
  const gratitudeEntries = recentJournal.filter((j) => j.category === "gratitude");

  // Habit stats
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const last7HabitLogs = data.habitLogs.filter((l) => l.completed && daysBetween(l.date, todayStr) <= 7);
  const habitRate = dailyHabits.length > 0 ? last7HabitLogs.length / (dailyHabits.length * 7) : 1;

  // ========================================
  // MORNING PHASE — Set the tone for the day
  // ========================================
  if (phase === "morning") {
    // --- HUSBAND ---
    const wife = data.people.find((p) => p.relationship === "wife");
    if (wife) {
      const wifeDays = wife.lastContact ? daysBetween(wife.lastContact, todayStr) : 999;
      const wifeMessages = [
        `Before the day pulls you in — what's one thing you can do for ${wife.name} today that she wouldn't expect?`,
        `${wife.name}'s love language matters. Words? Time? Acts? Touch? Gifts? Lead with hers, not yours.`,
        `Send ${wife.name} a text in the next 10 minutes. Not about logistics — something that shows she's on your mind.`,
        `What's the hardest thing on ${wife.name}'s plate right now? Can you take one thing off it today?`,
        `When's the last time you asked ${wife.name} how she's really doing — and just listened without fixing?`,
        avgMood < 3 ? `You've been running low. ${wife.name} can probably feel it. Don't withdraw — let her in.` : `You're in a good headspace. Share that energy with ${wife.name} today.`,
        wifeDays >= 2 ? `It's been ${wifeDays} days since you really connected with ${wife.name}. Tonight, make it happen.` : `You connected with ${wife.name} recently. Build on that momentum today.`,
      ];
      nudges.push(makeNudge("service", wifeMessages[dayIdx % wifeMessages.length], todayStr, wife.id));
    }

    // --- FATHER ---
    const kids = data.people.filter((p) => p.relationship === "child");
    if (kids.length > 0) {
      const kid = kids[dayIdx % kids.length];
      const kidMessages = [
        `Before ${kid.name} starts their day — say something encouraging. Set the tone for them.`,
        `What's ${kid.name} excited about right now? If you don't know, find out today.`,
        `Tell ${kid.name} one specific thing you're proud of them for. Kids remember specifics.`,
        `Does ${kid.name} know they can fail and you'll still be there? Remind them today.`,
        `${kid.name} needs your presence more than your provision. Plan 15 minutes of undivided time.`,
      ];
      nudges.push(makeNudge("relationship", kidMessages[dayIdx % kidMessages.length], todayStr, kid.id));
    }

    // --- SELF/MINDSET ---
    if (habitRate < 0.5) {
      nudges.push(makeNudge("self", "Your habit consistency is below 50%. Don't try to fix everything — pick your ONE most important habit and protect it today.", todayStr));
    } else if (habitRate >= 0.8) {
      nudges.push(makeNudge("self", `${Math.round(habitRate * 100)}% habit consistency. You're building real momentum. Don't break the chain.`, todayStr));
    }

    // Gratitude
    const gratitudeMessages = [
      "Name 3 things going right. Not big things — the small ones you're taking for granted.",
      "Who made your life better this week? Tell them today.",
      "What's one thing past-you would be amazed that you have now?",
      gratitudeEntries.length >= 3
        ? `You've logged ${gratitudeEntries.length} gratitude entries recently. That rewires your brain. Keep going.`
        : "Start the day with gratitude. It changes how you see everything else.",
    ];
    nudges.push(makeNudge("gratitude", gratitudeMessages[dayIdx % gratitudeMessages.length], todayStr));
  }

  // ========================================
  // MIDDAY PHASE — Check in and course correct
  // ========================================
  if (phase === "midday") {
    // --- RELATIONSHIP CHECK ---
    const overduePeople = data.people.filter((p) => {
      const days = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
      return days >= p.contactFrequency;
    }).sort((a, b) => {
      const aDays = a.lastContact ? daysBetween(a.lastContact, todayStr) : 999;
      const bDays = b.lastContact ? daysBetween(b.lastContact, todayStr) : 999;
      return bDays - aDays;
    });

    if (overduePeople.length > 0) {
      const person = overduePeople[0];
      const days = person.lastContact ? daysBetween(person.lastContact, todayStr) : 999;
      nudges.push(makeNudge("relationship", getOverdueMessage(person, days), todayStr, person.id));
    }

    // --- PARENT/GRANDPARENT ---
    const elders = data.people.filter((p) => p.relationship === "parent" || p.relationship === "grandparent");
    for (const elder of elders) {
      const days = elder.lastContact ? daysBetween(elder.lastContact, todayStr) : 999;
      if (days >= elder.contactFrequency) {
        nudges.push(makeNudge("relationship", `${days} days since you talked to ${elder.name}. A 5-minute call means the world to them. They won't be here forever.`, todayStr, elder.id));
        break; // Only one elder nudge at a time
      }
    }

    // --- CHORE ---
    const choreMessages = [
      "Walk through the house. What's the one thing that's been bugging your wife? Handle it.",
      "Is there a repair, a mess, or a project that's been on the 'later' list? 15 minutes. Start now.",
      "Look at the house through your wife's eyes. What would she want done? Do that.",
      "The kids' spaces — something broken, outgrown, or messy? Handle it before you're asked.",
      serviceEntries.length >= 3
        ? `You've done ${serviceEntries.length} acts of service recently. You're building trust and respect. What's next?`
        : "Acts of service aren't optional. They're how you show love through action.",
      "What's the one chore nobody wants to do? Be the one who does it. No announcement needed.",
    ];
    nudges.push(makeNudge("chore", choreMessages[dayIdx % choreMessages.length], todayStr));

    // --- CONNECTION QUALITY ---
    const lowQualityConnections = recentConnections.filter((c) => c.mood && c.mood <= 2);
    if (lowQualityConnections.length >= 2) {
      const personId = lowQualityConnections[0].personId;
      const person = data.people.find((p) => p.id === personId);
      if (person) {
        nudges.push(makeNudge("relationship", `Your last few interactions with ${person.name} haven't felt great. Consider having an honest conversation about how things are going between you two.`, todayStr, person.id));
      }
    }

    // --- SELF-CARE ---
    if (avgMood < 2.5) {
      nudges.push(makeNudge("self", "Your mood has been consistently low. You can't pour from an empty cup. What fills yours? Do that thing today.", todayStr));
    } else if (avgEnergy < 2.5) {
      nudges.push(makeNudge("self", "Your energy has been low. Sleep, movement, nutrition — which one needs attention? Pick one and fix it today.", todayStr));
    }
  }

  // ========================================
  // EVENING PHASE — Reflect and connect
  // ========================================
  if (phase === "evening") {
    // --- PRESENCE ---
    const wife = data.people.find((p) => p.relationship === "wife");
    if (wife) {
      const eveningWife = [
        `Phone down. TV off. Ask ${wife.name} about the best part of her day. Eye contact. Listen.`,
        `Tonight: be curious about ${wife.name}. Ask a question you haven't asked in a while.`,
        `Before bed, tell ${wife.name} one thing you appreciate about her from today. Be specific.`,
        `How was ${wife.name}'s day really? Not the surface answer — the real one. Ask twice if you have to.`,
      ];
      nudges.push(makeNudge("relationship", eveningWife[dayIdx % eveningWife.length], todayStr, wife.id));
    }

    // --- KIDS EVENING ---
    const kids = data.people.filter((p) => p.relationship === "child");
    if (kids.length > 0) {
      const kid = kids[(dayIdx + 1) % kids.length]; // Different kid than morning
      const kidEvening = [
        `Ask ${kid.name}: "What was the best part of your day?" Then: "What was hard?"`,
        `Read to ${kid.name}, play with them, or just sit and talk. No agenda. Just be there.`,
        `Before ${kid.name} goes to bed — remind them you love them and why.`,
        `${kid.name}'s day happened without you in it. Ask about it like you're genuinely curious.`,
      ];
      nudges.push(makeNudge("relationship", kidEvening[dayIdx % kidEvening.length], todayStr, kid.id));
    }

    // --- REFLECTION ---
    const reflectionMessages = [
      "What's one thing you did today that you're proud of? Write it down. You'll forget otherwise.",
      "What could you have done better today? Not to beat yourself up — to grow from it.",
      "Rate your day as a husband, father, and person. What would make tomorrow a 10?",
      "Compare yourself to who you were a month ago. Are you moving in the right direction?",
      `You've been using Command Center to grow. ${journalLogs.length} total entries logged. Every entry is a brick in the person you're building.`,
    ];
    nudges.push(makeNudge("self", reflectionMessages[dayIdx % reflectionMessages.length], todayStr));

    // --- GRATITUDE EVENING ---
    nudges.push(makeNudge("gratitude", "Before the day ends — what are 3 things you're grateful for? One about your family. One about yourself. One about your life.", todayStr));

    // --- DOMAIN BALANCE ---
    const taskDomains = data.tasks.filter((t) => !t.completed).map((t) => t.domain);
    const domainCounts: Record<string, number> = {};
    for (const d of taskDomains) domainCounts[d] = (domainCounts[d] || 0) + 1;
    const neglected = ["personal", "family", "work", "growth"].filter((d) => !domainCounts[d]);
    if (neglected.length > 0 && neglected.length < 4) {
      nudges.push(makeNudge("self", `No active tasks in ${neglected.join(", ")}. Tomorrow, add at least one intentional action in each area.`, todayStr));
    }
  }

  // ========================================
  // ALWAYS — Time-independent nudges
  // ========================================

  // Journal lapse
  if (journalLogs.length > 0 && recentJournal.length === 0) {
    nudges.push(makeNudge("self", "You haven't journaled in over 2 weeks. The data you log shapes the guidance you get. Take 2 minutes to reflect.", todayStr));
  }

  // Filter out completed nudges
  const existingCompleted = data.nudges
    .filter((n) => n.date === todayStr && n.completed)
    .map((n) => n.message);

  return nudges.filter((n) => !existingCompleted.includes(n.message));
}

// --- Helpers ---

function makeNudge(type: Nudge["type"], message: string, date: string, personId?: string): Nudge {
  return {
    id: date + "-" + type + "-" + simpleHash(message),
    type,
    message,
    personId,
    completed: false,
    date,
    createdAt: new Date().toISOString(),
  };
}

function getOverdueMessage(person: Person, days: number): string {
  const { name, relationship } = person;

  if (relationship === "wife") {
    if (days >= 3) return `It's been ${days} days since you really connected with ${name}. Not logistics — real connection. Tonight.`;
    return `Check in with ${name}. Ask how she's doing. Listen.`;
  }
  if (relationship === "child") {
    return `Quality time with ${name}. Not screens, not errands — genuine presence.`;
  }
  if (relationship === "parent" || relationship === "grandparent") {
    if (days >= 14) return `${name} hasn't heard from you in ${days} days. Call them. Today.`;
    return `Touch base with ${name}. Even a quick call.`;
  }
  if (relationship === "sibling") return `Check in with ${name}. You don't need a reason.`;
  if (relationship === "friend") return `Real friendships need maintenance. Reach out to ${name}.`;
  return `It's been ${days} days since you connected with ${name}. Reach out.`;
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

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 6);
}
