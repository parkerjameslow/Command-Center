import type { AppData, Nudge, Person } from "./store";

// Generate smart nudges based on user's data patterns
export function generateNudges(data: AppData, todayStr: string): Nudge[] {
  const nudges: Nudge[] = [];
  const hour = new Date().getHours();

  // --- RELATIONSHIP NUDGES ---
  for (const person of data.people) {
    const daysSinceContact = person.lastContact
      ? daysBetween(person.lastContact, todayStr)
      : 999;

    const overdue = daysSinceContact >= person.contactFrequency;
    const almostDue = daysSinceContact >= person.contactFrequency - 1;

    if (overdue) {
      nudges.push(makeNudge(
        "relationship",
        getRelationshipMessage(person, daysSinceContact),
        todayStr,
        person.id
      ));
    } else if (almostDue) {
      nudges.push(makeNudge(
        "relationship",
        `It's been a few days since you connected with ${person.name}. Maybe a quick text?`,
        todayStr,
        person.id
      ));
    }
  }

  // --- ACT OF SERVICE NUDGES ---
  // Morning: suggest something for wife
  if (hour < 12) {
    const wife = data.people.find((p) => p.relationship === "wife");
    if (wife) {
      const services = [
        `What's one thing you can do for ${wife.name} today that she wouldn't expect?`,
        `Before you get busy — has ${wife.name} mentioned anything she needs help with?`,
        `Small things matter. Coffee, a note, handling something she usually handles.`,
        `Think about ${wife.name}'s week. What's weighing on her? Can you take one thing off her plate?`,
        `When's the last time you asked ${wife.name} how she's really doing — and just listened?`,
      ];
      nudges.push(makeNudge("service", services[dayOfYear() % services.length], todayStr));
    }
  }

  // --- KID CHECK-IN NUDGES ---
  const kids = data.people.filter((p) => p.relationship === "child");
  if (kids.length > 0 && hour >= 14 && hour <= 20) {
    const kidMessages = [
      (name: string) => `Have you asked ${name} about their day? Not "how was school" — ask something specific.`,
      (name: string) => `${name} needs your presence, not just your provision. 10 minutes of undivided attention.`,
      (name: string) => `What's ${name} excited about right now? Do you know?`,
      (name: string) => `Find a reason to encourage ${name} today. Catch them doing something right.`,
      (name: string) => `Does ${name} know you're proud of them? Tell them why — be specific.`,
    ];
    const kid = kids[dayOfYear() % kids.length];
    const msg = kidMessages[dayOfYear() % kidMessages.length];
    nudges.push(makeNudge("relationship", msg(kid.name), todayStr, kid.id));
  }

  // --- PARENT/GRANDPARENT NUDGES ---
  const elders = data.people.filter((p) => p.relationship === "parent" || p.relationship === "grandparent");
  for (const elder of elders) {
    const daysSince = elder.lastContact ? daysBetween(elder.lastContact, todayStr) : 999;
    if (daysSince >= elder.contactFrequency) {
      nudges.push(makeNudge(
        "relationship",
        `You haven't called ${elder.name} in ${daysSince} days. They won't be here forever. Pick up the phone.`,
        todayStr,
        elder.id
      ));
    }
  }

  // --- CHORE / HOME NUDGES ---
  if (hour >= 8 && hour <= 21) {
    const choreIdeas = [
      "Walk through the house. What's one thing that's been broken or messy for too long? Fix it today.",
      "Check the garage, the yard, the closet. What's been on the 'I'll get to it' list?",
      "Is there a lightbulb out? A drawer that sticks? A thing your wife has mentioned twice? Handle it.",
      "Take 15 minutes. One chore you've been avoiding. Just start it.",
      "Look at the house through your wife's eyes. What would she want done?",
      "Something in the kitchen needs attention. Organize a drawer, clean behind the fridge, fix the thing.",
      "The kids' spaces — is something broken, messy, or outgrown? Handle it before being asked.",
    ];
    nudges.push(makeNudge("chore", choreIdeas[dayOfYear() % choreIdeas.length], todayStr));
  }

  // --- SELF-CARE / BALANCE NUDGES ---
  const recentMoods = data.journal
    .filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7)
    .map((j) => j.mood!);
  const avgMood = recentMoods.length > 0
    ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
    : 3;

  if (avgMood < 3) {
    nudges.push(makeNudge(
      "self",
      "Your mood has been lower this week. You can't pour from an empty cup. What fills yours?",
      todayStr
    ));
  }

  // Check habit completion rate
  const recentLogs = data.habitLogs.filter((l) => daysBetween(l.date, todayStr) <= 7 && l.completed);
  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  if (dailyHabits.length > 0) {
    const rate = recentLogs.length / (dailyHabits.length * 7);
    if (rate < 0.5) {
      nudges.push(makeNudge(
        "self",
        "Your habit consistency has dropped below 50% this week. Pick the ONE most important habit and protect it today.",
        todayStr
      ));
    }
  }

  // --- DOMAIN BALANCE NUDGES ---
  const taskDomains = data.tasks.filter((t) => !t.completed).map((t) => t.domain);
  const domainCounts: Record<string, number> = {};
  for (const d of taskDomains) domainCounts[d] = (domainCounts[d] || 0) + 1;
  const domains = ["personal", "family", "work", "growth"];
  const neglectedDomains = domains.filter((d) => !domainCounts[d] || domainCounts[d] === 0);
  if (neglectedDomains.length > 0 && neglectedDomains.length < 4) {
    nudges.push(makeNudge(
      "self",
      `You have zero active tasks in ${neglectedDomains.join(", ")}. Balance means all areas get attention.`,
      todayStr
    ));
  }

  // --- GRATITUDE / MINDSET NUDGES ---
  if (hour >= 12 && hour <= 15) {
    const gratitudePrompts = [
      "Pause. Name 3 things going right in your life right now.",
      "Who made your life better this week? Have you told them?",
      "You're building something meaningful. Don't forget to appreciate the process.",
      "Compare yourself to who you were a month ago, not to someone else today.",
      "What's one thing you're taking for granted that past-you would be grateful for?",
    ];
    nudges.push(makeNudge("gratitude", gratitudePrompts[dayOfYear() % gratitudePrompts.length], todayStr));
  }

  // --- JOURNAL-INFORMED NUDGES ---
  const journalLogs = data.journalLogs || [];
  const recentJournalLogs = journalLogs.filter((j) => daysBetween(j.date, todayStr) <= 14);

  // If they've been logging gratitude, encourage it
  const gratitudeEntries = recentJournalLogs.filter((j) => j.category === "gratitude");
  if (gratitudeEntries.length >= 3 && hour >= 8 && hour <= 11) {
    nudges.push(makeNudge(
      "gratitude",
      `You've logged ${gratitudeEntries.length} gratitude entries recently. That practice is changing your brain. Keep it going — what are you grateful for right now?`,
      todayStr
    ));
  }

  // If they haven't logged anything in a while, nudge
  if (journalLogs.length > 0 && recentJournalLogs.length === 0) {
    nudges.push(makeNudge(
      "self",
      "You haven't journaled in over 2 weeks. The data you log shapes the guidance you get. Take 2 minutes to reflect.",
      todayStr
    ));
  }

  // If recent service entries exist, build on them
  const serviceEntries = recentJournalLogs.filter((j) => j.category === "service");
  if (serviceEntries.length >= 2) {
    nudges.push(makeNudge(
      "service",
      `You've done ${serviceEntries.length} acts of service recently. That pattern is building trust. What's the next level?`,
      todayStr
    ));
  }

  // If recent connection logs show declining mood with a specific person
  const connectionEntries = recentJournalLogs.filter((j) => j.category === "connection" && j.mood);
  if (connectionEntries.length >= 3) {
    const lowMoodConnections = connectionEntries.filter((j) => (j.mood || 3) <= 2);
    if (lowMoodConnections.length >= 2) {
      const personId = lowMoodConnections[0].relatedPersonId;
      const person = personId ? data.people.find((p) => p.id === personId) : null;
      if (person) {
        nudges.push(makeNudge(
          "relationship",
          `Your last few interactions with ${person.name} haven't felt great. Something might need attention. Consider having an honest conversation about how things are going.`,
          todayStr,
          person.id
        ));
      }
    }
  }

  // If mood is trending down in journal entries, suggest change
  const moodEntries = recentJournalLogs.filter((j) => j.mood).map((j) => j.mood!);
  if (moodEntries.length >= 5) {
    const recentHalf = moodEntries.slice(0, Math.floor(moodEntries.length / 2));
    const olderHalf = moodEntries.slice(Math.floor(moodEntries.length / 2));
    const recentAvg = recentHalf.reduce((a, b) => a + b, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((a, b) => a + b, 0) / olderHalf.length;
    if (recentAvg < olderAvg - 0.5) {
      nudges.push(makeNudge(
        "self",
        "Your journal entries show your mood has been declining. What changed? Sometimes naming the thing is the first step to fixing it.",
        todayStr
      ));
    }
  }

  // Filter out already-completed nudges for today
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

// Relationship-specific messages based on how overdue
function getRelationshipMessage(person: Person, days: number): string {
  const { name, relationship } = person;

  if (relationship === "wife") {
    if (days >= 3) return `It's been ${days} days since you really connected with ${name}. Not logistics — real connection. Tonight.`;
    return `Check in with ${name}. Ask how she's doing. Listen.`;
  }

  if (relationship === "parent" || relationship === "grandparent") {
    if (days >= 14) return `${name} hasn't heard from you in ${days} days. Call them. Today. No excuses.`;
    if (days >= 7) return `It's been over a week since you talked to ${name}. A 5-minute call means the world.`;
    return `Touch base with ${name}. Even a quick text.`;
  }

  if (relationship === "child") {
    return `Quality time with ${name}. Not screens, not errands — genuine presence.`;
  }

  return `It's been ${days} days since you connected with ${name}. Reach out.`;
}
