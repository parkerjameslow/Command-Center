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

  // ==========================
  // DATA-DRIVEN CONTEXT
  // ==========================
  const journalLogs = data.journalLogs || [];
  const recentJournal = journalLogs.filter((j) => daysBetween(j.date, todayStr) <= 14);
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 3;
  const avgEnergy = (() => {
    const e = data.journal.filter((j) => j.energy && daysBetween(j.date, todayStr) <= 7).map((j) => j.energy!);
    return e.length > 0 ? e.reduce((a, b) => a + b, 0) / e.length : 3;
  })();

  const connectionLogs = data.connectionLogs || [];
  const recentConnections = connectionLogs.filter((c) => daysBetween(c.date, todayStr) <= 14);
  const serviceEntries = recentJournal.filter((j) => j.category === "service");
  const gratitudeEntries = recentJournal.filter((j) => j.category === "gratitude");

  const dailyHabits = data.habits.filter((h) => h.frequency === "daily");
  const last7HabitLogs = data.habitLogs.filter((l) => l.completed && daysBetween(l.date, todayStr) <= 7);
  const habitRate = dailyHabits.length > 0 ? last7HabitLogs.length / (dailyHabits.length * 7) : 1;

  const wife = data.people.find((p) => p.relationship === "wife");
  const kids = data.people.filter((p) => p.relationship === "child");
  const parents = data.people.filter((p) => p.relationship === "parent");
  const grandparents = data.people.filter((p) => p.relationship === "grandparent");
  const friends = data.people.filter((p) => p.relationship === "friend");

  const overduePeople = data.people.filter((p) => {
    const days = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
    return days >= p.contactFrequency;
  });

  // ==========================
  // BUILD FULL NUDGE QUEUE (10-15 nudges/day)
  // ==========================

  // ----- HUSBAND NUDGES (3-4/day) -----
  if (wife) {
    const wifeDays = wife.lastContact ? daysBetween(wife.lastContact, todayStr) : 999;

    // Morning husband nudge
    const morningWife = [
      `Before the day pulls you in — do one small thing for ${wife.name} without being asked.`,
      `Send ${wife.name} a text right now. Not logistics — something that shows you're thinking of her.`,
      `What's ${wife.name} worried about this week? Acknowledge it today.`,
      `Tell ${wife.name} one thing you appreciate about her. Be specific.`,
      avgMood < 3 ? `You've been running low. ${wife.name} feels it. Don't withdraw — tell her what's on your mind.` : `You're in a good place. Share that energy with ${wife.name}.`,
    ];
    nudges.push(makeNudge("relationship", morningWife[dayIdx % morningWife.length], todayStr, wife.id));

    // Midday husband nudge
    const middayWife = [
      `Mid-day pause: send ${wife.name} something that'll make her smile.`,
      `Ask ${wife.name}: "What's one thing I can take off your plate today?"`,
      `If ${wife.name} asked you to do something recently — have you done it?`,
      `Plan one small surprise for ${wife.name} for tonight.`,
      wifeDays >= 2 ? `It's been ${wifeDays} days since real connection with ${wife.name}. Make tonight different.` : `Keep the momentum going with ${wife.name} — one intentional gesture.`,
    ];
    nudges.push(makeNudge("relationship", middayWife[(dayIdx + 1) % middayWife.length], todayStr, wife.id));

    // Evening husband nudge
    const eveningWife = [
      `Phone away tonight. Ask ${wife.name} about her day and actually listen.`,
      `Before bed, tell ${wife.name} one specific thing you appreciated today.`,
      `No logistics tonight. Talk about dreams, fears, something real.`,
      `${wife.name} doesn't need perfection. She needs presence. 20 minutes.`,
    ];
    nudges.push(makeNudge("relationship", eveningWife[dayIdx % eveningWife.length], todayStr, wife.id));
  }

  // ----- FATHER NUDGES (3-4/day, rotate through kids) -----
  if (kids.length > 0) {
    // Morning kid
    const morningKid = kids[dayIdx % kids.length];
    const morningKidMsgs = [
      `Before ${morningKid.name} starts their day — say something encouraging. Set the tone.`,
      `What's ${morningKid.name} excited about right now? If you don't know, find out today.`,
      `Give ${morningKid.name} a real hug before they leave. Not a quick one.`,
      `Ask ${morningKid.name} how they're feeling — and wait for the honest answer.`,
    ];
    nudges.push(makeNudge("relationship", morningKidMsgs[dayIdx % morningKidMsgs.length], todayStr, morningKid.id));

    // Midday kid (different kid if possible)
    const middayKid = kids[(dayIdx + 1) % kids.length];
    const middayKidMsgs = [
      `Send ${middayKid.name} a text just to say you're thinking of them (if they have a phone).`,
      `Plan something small for ${middayKid.name} tonight — just the two of you.`,
      `Catch ${middayKid.name} doing something right today. Be specific about what you noticed.`,
      `What's one skill you could teach ${middayKid.name} this week?`,
    ];
    nudges.push(makeNudge("relationship", middayKidMsgs[dayIdx % middayKidMsgs.length], todayStr, middayKid.id));

    // Evening kid (all or another rotation)
    const eveningKid = kids[(dayIdx + 2) % kids.length];
    const eveningKidMsgs = [
      `Ask ${eveningKid.name}: "What was the best part of your day?" Then: "What was hard?"`,
      `Read to ${eveningKid.name} tonight, or just sit and talk. No agenda.`,
      `Before bed, tell ${eveningKid.name} you love them. And why.`,
      `15 minutes of undivided attention with ${eveningKid.name}. No phone.`,
    ];
    nudges.push(makeNudge("relationship", eveningKidMsgs[dayIdx % eveningKidMsgs.length], todayStr, eveningKid.id));
  }

  // ----- PARENTS / GRANDPARENTS (1-2/day) -----
  for (const elder of [...parents, ...grandparents]) {
    const days = elder.lastContact ? daysBetween(elder.lastContact, todayStr) : 999;
    if (days >= elder.contactFrequency) {
      nudges.push(makeNudge(
        "relationship",
        `${days} days since you talked to ${elder.name}. A 5-minute call means the world to them. They won't be here forever — pick up the phone today.`,
        todayStr,
        elder.id
      ));
    }
  }

  // ----- FRIENDS (1/day if overdue) -----
  const overdueFriend = friends.find((f) => {
    const days = f.lastContact ? daysBetween(f.lastContact, todayStr) : 999;
    return days >= f.contactFrequency;
  });
  if (overdueFriend) {
    nudges.push(makeNudge(
      "relationship",
      `Reach out to ${overdueFriend.name}. Real friendships need maintenance. No agenda — just check in.`,
      todayStr,
      overdueFriend.id
    ));
  }

  // ----- PROVIDER / CHORE NUDGES (2-3/day) -----
  const choreMorning = [
    "Make your bed. It's the first win of the day.",
    "Take 10 minutes to tidy one area before you start work.",
    "Load the dishwasher if it needs it — start the day with a clean kitchen.",
    "Check the calendar for what the family needs today.",
  ];
  nudges.push(makeNudge("chore", choreMorning[dayIdx % choreMorning.length], todayStr));

  const choreMidday = [
    "Take out the trash and recycling if they're full.",
    "Walk through the house. What's one thing bugging your wife? Fix it.",
    "That repair you've been avoiding — 15 minutes, start now.",
    "Check the yard. Anything urgent? Handle it before the weekend.",
    "Restock the bathroom — toilet paper, soap, towels. Small prep prevents small frustrations.",
  ];
  nudges.push(makeNudge("chore", choreMidday[dayIdx % choreMidday.length], todayStr));

  const choreEvening = [
    "Do the dishes tonight. Clean kitchen tomorrow = better morning.",
    "Lay out tomorrow's clothes and prep the coffee.",
    "A quick walk-through of the house — lights off, doors locked, kids tucked.",
    "Clean the car or garage one section at a time. 15 minutes only.",
  ];
  nudges.push(makeNudge("chore", choreEvening[dayIdx % choreEvening.length], todayStr));

  // ----- ACT OF SERVICE (1-2/day) -----
  const serviceMsgs = [
    wife ? `Do something for ${wife.name} today without telling her. Act of quiet service.` : "Do something kind for someone without telling them.",
    "Write a handwritten note and leave it where someone will find it.",
    "Bring home a small surprise — coffee, flowers, a favorite snack.",
    kids.length > 0 ? `Plan a small surprise activity for the kids this weekend.` : "Plan a small surprise for someone you love.",
    wife ? `Take something off ${wife.name}'s plate today. Don't announce it.` : "Anonymously help someone in your life today.",
    serviceEntries.length >= 3 ? `${serviceEntries.length} acts of service recently. You're building a pattern. Keep going.` : "Your family doesn't need grand gestures. They need consistent small ones.",
  ];
  nudges.push(makeNudge("service", serviceMsgs[dayIdx % serviceMsgs.length], todayStr));

  // ----- GROWTH / LEARNING (1/day) -----
  const growthMsgs = [
    "Read for 20 minutes today. Book, not feed.",
    "Listen to a podcast that challenges you while you do chores.",
    "Teach someone something you know. Teaching cements mastery.",
    "Write down one lesson from today before you forget it.",
    "What would 5-years-from-now-you be grateful you started today?",
    gratitudeEntries.length >= 3 ? `${gratitudeEntries.length} gratitude entries recently. That rewires your brain. Keep it going.` : "Start a gratitude practice. One line. Every day.",
  ];
  nudges.push(makeNudge("service", growthMsgs[dayIdx % growthMsgs.length], todayStr));

  // ----- HEALTH / SELF (1-2/day) -----
  const healthMsgs = [
    "Drink a full glass of water. Right now.",
    "Stand up, stretch, walk around for 5 minutes.",
    "Get outside for 10 minutes of sunlight.",
    "Move your body today. 30 minutes. Non-negotiable.",
    avgEnergy < 3 ? "Your energy is low. Sleep earlier tonight. Cut the late scrolling." : "You've got energy. Use it on the hardest thing on your list.",
    "Eat one real meal today. No processed food.",
    "Breathe deeply for 60 seconds. Right now. Do it.",
  ];
  nudges.push(makeNudge("service", healthMsgs[dayIdx % healthMsgs.length], todayStr));

  // ----- PRESENCE / MINDSET (1-2/day) -----
  const presenceMsgs = [
    "Put the phone down for the next hour. Be where you are.",
    "Take 3 deep breaths before your next interaction.",
    "What story are you telling yourself today? Is it true? Is it useful?",
    "Who made your life better this week? Tell them today.",
    avgMood < 3 ? "You've been running low. Name the thing — don't bottle it." : "You're in a good headspace. Be the calm in the room today.",
    "Be the first to apologize today if needed. Ego is expensive.",
  ];
  nudges.push(makeNudge("service", presenceMsgs[dayIdx % presenceMsgs.length], todayStr));

  // ----- CONSISTENCY REINFORCEMENT -----
  if (habitRate < 0.5) {
    nudges.push(makeNudge("service", "Habit rate under 50%. Pick the ONE most important habit and do only that today.", todayStr));
  } else if (habitRate >= 0.8) {
    nudges.push(makeNudge("service", `${Math.round(habitRate * 100)}% habit consistency. Don't break the chain.`, todayStr));
  }

  // ----- CONNECTION QUALITY WARNING -----
  const lowQualityConnections = recentConnections.filter((c) => c.mood && c.mood <= 2);
  if (lowQualityConnections.length >= 2) {
    const personId = lowQualityConnections[0].personId;
    const person = data.people.find((p) => p.id === personId);
    if (person) {
      nudges.push(makeNudge(
        "relationship",
        `Recent interactions with ${person.name} haven't felt great. Something might need an honest conversation.`,
        todayStr,
        person.id
      ));
    }
  }

  // ----- OVERDUE RELATIONSHIP CATCH-ALL -----
  for (const p of overduePeople) {
    if (p.relationship === "parent" || p.relationship === "grandparent") continue; // already covered
    if (p.relationship === "friend" && p.id === overdueFriend?.id) continue; // already covered
    const days = p.lastContact ? daysBetween(p.lastContact, todayStr) : 999;
    nudges.push(makeNudge(
      "relationship",
      `${days} days since ${p.name}. Reach out today — even briefly.`,
      todayStr,
      p.id
    ));
  }

  // ==========================
  // FILTER + SORT
  // ==========================

  // Filter out completed nudges
  const existingCompleted = data.nudges
    .filter((n) => n.date === todayStr && n.completed)
    .map((n) => n.message);

  const filtered = nudges.filter((n) => !existingCompleted.includes(n.message));

  // De-duplicate by message
  const seen = new Set<string>();
  const unique = filtered.filter((n) => {
    if (seen.has(n.message)) return false;
    seen.add(n.message);
    return true;
  });

  return unique;
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
