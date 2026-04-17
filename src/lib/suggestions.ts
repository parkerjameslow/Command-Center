import type { AppData } from "./store";
import type { Suggestion } from "@/components/Top3Suggestions";

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ==========================
// PERSONAL — self-care, mindset, health
// ==========================
export function generatePersonalSuggestions(data: AppData, todayStr: string): Suggestion[] {
  const dayIdx = dayOfYear();
  const recentJournal = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 7);
  const recentMoods = data.journal.filter((j) => j.mood && daysBetween(j.date, todayStr) <= 7).map((j) => j.mood!);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length : 3;
  const gratitudeCount = recentJournal.filter((j) => j.category === "gratitude").length;

  const health = [
    { title: "Move your body for 30 minutes — walk, run, lift, stretch", why: "Physical health is the foundation of everything else." },
    { title: "Drink water before caffeine today", why: "You're probably dehydrated. Small shift, big energy gain." },
    { title: "Get outside for 10 minutes of sunlight", why: "Natural light regulates sleep, mood, and hormones." },
    { title: "Eat one real meal — no processed food", why: "What you put in your body shapes what you give out." },
    { title: "Stretch for 10 minutes — especially your back and hips", why: "Desk life is tight. Mobility before mobility breaks down." },
  ];

  const mindset = [
    avgMood < 3
      ? { title: "Identify what's been weighing on you — write it down", why: "You can't fix what you won't name. Honest self-assessment first." }
      : { title: "Read or listen to something that challenges you", why: "Growth requires new input. Don't let your mind go stale." },
    gratitudeCount === 0
      ? { title: "Write down 3 things you're grateful for right now", why: "No gratitude logged recently. Rewire your default thinking." }
      : { title: "Reflect on one lesson you've learned this week", why: "Experience without reflection doesn't become wisdom." },
    { title: "Meditate or breathe deeply for 5 minutes", why: "Your mind needs stillness as much as your body needs rest." },
    { title: "Put the phone down for an hour today", why: "Attention is a finite resource. Protect it from the algorithm." },
  ];

  const selfCare = [
    { title: "Go to bed 30 minutes earlier tonight", why: "Sleep isn't a reward. It's the base layer of everything." },
    { title: "Take 15 minutes alone — no kids, no phone, just you", why: "You need solitude to show up fully for others." },
    { title: "Do something just for fun today", why: "Hobbies aren't optional. Play is how you recharge." },
    { title: "Call someone you haven't talked to in a while", why: "Your social health affects every other metric." },
  ];

  return [
    { ...health[dayIdx % health.length], category: "Health", bg: "bg-personal/5 border-personal/20" },
    { ...mindset[dayIdx % mindset.length], category: "Mindset", bg: "bg-accent/5 border-accent/20" },
    { ...selfCare[dayIdx % selfCare.length], category: "Self-Care", bg: "bg-growth/5 border-growth/20" },
  ];
}

// ==========================
// FAMILY — wife, kids, presence, service
// ==========================
export function generateFamilySuggestions(data: AppData, todayStr: string): Suggestion[] {
  const dayIdx = dayOfYear();
  const wife = data.people.find((p) => p.relationship === "wife");
  const kids = data.people.filter((p) => p.relationship === "child");
  const suggestions: Suggestion[] = [];

  // Wife-focused
  if (wife) {
    const wifeSuggestions = [
      { title: `Send ${wife.name} a text telling her one specific thing you appreciate`, why: "Be specific. Generic compliments feel hollow." },
      { title: `Ask ${wife.name} how you can help her this week`, why: "The simplest act of love is asking and then listening." },
      { title: `Plan something just for the two of you — no kids`, why: "Your marriage needs intentional time, not leftover time." },
      { title: `Do ${wife.name}'s least favorite chore today without being asked`, why: "Act as if you were the only one who could do it." },
      { title: `Put the phone down and have a real conversation tonight`, why: "Presence is the gift she notices most." },
      { title: `Ask ${wife.name} about her biggest frustration right now — and listen without fixing`, why: "Most of the time, she needs to be heard, not rescued." },
    ];
    suggestions.push({
      ...wifeSuggestions[dayIdx % wifeSuggestions.length],
      category: `For ${wife.name}`,
      bg: "bg-family/5 border-family/20",
    });
  }

  // Kids-focused
  if (kids.length > 0) {
    const kid = kids[dayIdx % kids.length];
    const kidSuggestions = [
      { title: `Give ${kid.name} 15 minutes of undivided attention — they pick the activity`, why: "Time spells love. Let them choose what you do together." },
      { title: `Tell ${kid.name} specifically what you're proud of them for`, why: "Generic praise doesn't stick. Be specific about what you noticed." },
      { title: `Ask ${kid.name}: "What was the hardest part of your day?"`, why: "The easy questions get surface answers. Dig deeper." },
      { title: `Teach ${kid.name} a skill you know — anything practical`, why: "Kids remember the things you showed them more than what you said." },
      { title: `Apologize to ${kid.name} if you lost your patience recently`, why: "Modeling repair teaches them how to do it in their own lives." },
    ];
    suggestions.push({
      ...kidSuggestions[dayIdx % kidSuggestions.length],
      category: kid.name,
      bg: "bg-personal/5 border-personal/20",
    });
  }

  // Acts of service / family culture
  const familyActs = [
    { title: "Plan a family activity for this weekend", why: "Don't wait to be asked. Take the lead on quality time." },
    { title: "Write a handwritten note and leave it somewhere she'll find it", why: "Not a text. Something physical. It hits different." },
    { title: "Cook dinner tonight — you handle it start to finish", why: "Give your wife a night off without making a big deal of it." },
    { title: "Take the kids out so your wife gets 2 hours alone", why: "Solitude is a gift you can give without spending a dime." },
    { title: "Bring home her favorite coffee, snack, or flowers", why: "Small unexpected gestures compound over time." },
  ];
  suggestions.push({
    ...familyActs[dayIdx % familyActs.length],
    category: "Acts of Service",
    bg: "bg-growth/5 border-growth/20",
  });

  // If fewer than 3 (no wife/kids), fill in
  while (suggestions.length < 3) {
    suggestions.push({
      title: "Reach out to a family member you haven't talked to lately",
      why: "Family ties need maintenance. Even a short text counts.",
      category: "Connection",
      bg: "bg-family/5 border-family/20",
    });
  }

  return suggestions.slice(0, 3);
}

// ==========================
// GROWTH — learning, habits, goals, long-term
// ==========================
export function generateGrowthSuggestions(data: AppData, todayStr: string): Suggestion[] {
  const dayIdx = dayOfYear();
  const recentJournal = (data.journalLogs || []).filter((j) => daysBetween(j.date, todayStr) <= 14);
  const lessons = recentJournal.filter((j) => j.category === "lesson").length;
  const wins = recentJournal.filter((j) => j.category === "win").length;

  const learning = [
    { title: "Read for 20 minutes — a book, not a feed", why: "Feeds are fast food. Books build thinkers." },
    { title: "Listen to a podcast about something outside your field", why: "Cross-pollination is where real insight comes from." },
    { title: "Teach someone something you know", why: "Teaching is the fastest way to master what you know." },
    { title: "Write down one thing you learned today", why: `${lessons} lessons logged recently. Every entry sharpens you.` },
    { title: "Watch a 10-minute video that teaches you a new skill", why: "Small learning compounds. You're 1% better every day." },
  ];

  const reflection = [
    wins === 0
      ? { title: "Log a win from this week — something you're proud of", why: "No wins logged recently. Start noticing what's going right." }
      : { title: "Reflect on your biggest win this month", why: "Momentum builds when you acknowledge progress." },
    { title: "Ask yourself: what would 5-years-from-now-me do today?", why: "Act from the identity of who you want to become." },
    { title: "Identify one habit holding you back", why: "You can't outgrow a habit you won't name." },
    { title: "Compare yourself to who you were a year ago — write what's changed", why: "Progress is invisible day-to-day. Zoom out to see it." },
    { title: "List 3 skills you want to develop this quarter", why: "Specificity turns hope into plan." },
  ];

  const identity = [
    { title: "Define what kind of man you want to be this year", why: "The man you're becoming starts with who you've decided to be." },
    { title: "Review your top 3 goals — are you actually working on them?", why: "Most goals die from quiet abandonment, not hard failure." },
    { title: "Spend 10 minutes planning tomorrow tonight", why: "A planned day is a day you actually live, not just react to." },
    { title: "Delete one thing from your life that doesn't serve you", why: "Growth is often subtraction, not addition." },
    { title: "Identify the one thing that would make everything else easier", why: "Leverage beats effort. Find the domino that knocks down the others." },
  ];

  return [
    { ...learning[dayIdx % learning.length], category: "Learning", bg: "bg-growth/5 border-growth/20" },
    { ...reflection[dayIdx % reflection.length], category: "Reflection", bg: "bg-accent/5 border-accent/20" },
    { ...identity[dayIdx % identity.length], category: "Identity", bg: "bg-personal/5 border-personal/20" },
  ];
}
