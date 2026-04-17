"use client";

import type { AppData, Person, JournalEntry } from "@/lib/store";
import Link from "next/link";

interface PeoplePulseProps {
  data: AppData;
  todayStr: string;
  onConnect: (personId: string) => void;
}

export function PeoplePulse({ data, todayStr, onConnect }: PeoplePulseProps) {
  if (data.people.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">My People</h2>
        <Link
          href="/people"
          className="block bg-card border border-dashed border-card-border rounded-xl p-4 text-center text-sm text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add the people who matter most
        </Link>
      </section>
    );
  }

  const hour = new Date().getHours();
  const recentJournals = data.journal
    .filter((j) => daysBetween(j.date, todayStr) <= 7)
    .sort((a, b) => b.date.localeCompare(a.date));

  const avgMood = getAvgMood(recentJournals);
  const avgEnergy = getAvgEnergy(recentJournals);

  // Sort people by urgency (most overdue first)
  const peopleWithStatus = data.people
    .map((person) => {
      const days = person.lastContact ? daysBetween(person.lastContact, todayStr) : 999;
      const ratio = days / person.contactFrequency;
      const status: "good" | "due" | "overdue" =
        ratio < 0.7 ? "good" : ratio < 1 ? "due" : "overdue";
      const suggestion = getSuggestion(person, days, avgMood, avgEnergy, hour, data);
      return { person, days, status, suggestion, ratio };
    })
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">My People</h2>
        <Link href="/people" className="text-xs text-accent">Manage</Link>
      </div>
      <div className="space-y-2">
        {peopleWithStatus.map(({ person, days, status, suggestion }) => (
          <Link
            href={`/people/${person.id}`}
            key={person.id}
            className={`block bg-card border rounded-xl p-3 ${
              status === "overdue"
                ? "border-danger/30"
                : status === "due"
                ? "border-warning/30"
                : "border-card-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Heartbeat indicator */}
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status === "overdue"
                      ? "bg-danger animate-pulse"
                      : status === "due"
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                />
                <span className="text-[9px] text-muted">
                  {status === "overdue" ? "!" : status === "due" ? "~" : "OK"}
                </span>
              </div>

              {/* Person info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{person.name}</span>
                  <span className="text-[10px] text-muted capitalize">{person.relationship}</span>
                </div>
                <div className="text-[11px] text-muted">
                  {days === 0
                    ? "Connected today"
                    : days === 999
                    ? "No contact yet"
                    : `${days}d ago`}
                </div>
              </div>

              {/* Quick connect button */}
              {days !== 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); onConnect(person.id); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                    status === "overdue"
                      ? "bg-danger text-white"
                      : status === "due"
                      ? "bg-warning text-white"
                      : "bg-card-border text-muted"
                  }`}
                >
                  Connected
                </button>
              )}
              {days === 0 && (
                <span className="text-success text-xs">✓</span>
              )}
            </div>

            {/* Contextual suggestion */}
            {suggestion && (
              <div className="mt-2 pl-6 text-[12px] text-muted italic leading-relaxed">
                {suggestion}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// --- Suggestion engine ---

function getSuggestion(
  person: Person,
  daysSinceContact: number,
  avgMood: number,
  avgEnergy: number,
  hour: number,
  data: AppData
): string | null {
  const { relationship, name } = person;

  // Only show suggestions for overdue or due people, or randomly for good ones
  const isOverdue = daysSinceContact >= person.contactFrequency;
  const isDue = daysSinceContact >= person.contactFrequency * 0.7;

  if (!isOverdue && !isDue) {
    // Occasionally show a proactive suggestion for people you're current with
    if (dayOfYear() % 3 !== 0) return null;
    return getProactiveSuggestion(person, avgMood);
  }

  if (relationship === "wife") {
    if (avgMood < 3 && avgEnergy < 3) {
      return `You've been running low this week. She's probably noticed. Be honest about how you're doing — vulnerability builds connection.`;
    }
    if (hour < 12) {
      return `Send her a text right now. Not about logistics — something that shows you're thinking about her.`;
    }
    if (hour >= 17) {
      return `Tonight: put the phone down. Ask about her day. Actually listen. Eye contact.`;
    }
    const ideas = [
      `What was the last thing she asked you to do? Did you do it?`,
      `Think about what's stressing her most right now. Can you take it off her plate today?`,
      `When's the last time you planned something just for the two of you?`,
      `She doesn't need you to fix things. She needs you to hear her.`,
    ];
    return ideas[dayOfYear() % ideas.length];
  }

  if (relationship === "child") {
    if (hour >= 6 && hour < 9) {
      return `Before ${name} starts their day — say something encouraging. Set the tone.`;
    }
    if (hour >= 15 && hour < 20) {
      return `${name}'s day happened without you in it. Ask about the best part. And the hard part.`;
    }
    const ideas = [
      `Do something together that ${name} picks. Not what you want — what they want.`,
      `Tell ${name} specifically what you're proud of them for. Kids remember the specifics.`,
      `How is ${name} really doing emotionally? Would they tell you if they weren't OK?`,
      `${name} needs your undivided time. 15 minutes, phone away, fully present.`,
    ];
    return ideas[dayOfYear() % ideas.length];
  }

  if (relationship === "parent") {
    if (daysSinceContact >= 14) {
      return `${daysSinceContact} days. They're not going to call you — they don't want to bother you. That's exactly why you should call.`;
    }
    if (avgMood >= 4) {
      return `You're in a good headspace. Share that energy with ${name}. Call and tell them something good.`;
    }
    return `A 5-minute call will make their whole day. You know this.`;
  }

  if (relationship === "grandparent") {
    if (daysSinceContact >= 21) {
      return `${daysSinceContact} days without hearing from you. Time is not infinite here. Call today.`;
    }
    return `${name} would love to hear your voice. Even 3 minutes.`;
  }

  if (relationship === "sibling") {
    return `Check in with ${name}. You don't have to have a reason — just reach out.`;
  }

  if (relationship === "friend") {
    return `Real friendships need maintenance. Send ${name} a text. No agenda, just connection.`;
  }

  return `Reach out to ${name}. Connection isn't automatic — it takes intention.`;
}

function getProactiveSuggestion(person: Person, avgMood: number): string | null {
  const { name, relationship } = person;

  if (relationship === "wife") {
    const ideas = [
      `Things are good with ${name}. Don't coast — do something unexpected today.`,
      `You're connected, but are you growing together? What's one thing you could learn about her this week?`,
      null,
    ];
    return ideas[dayOfYear() % ideas.length];
  }

  if (relationship === "child") {
    const ideas = [
      `${name}'s world is changing fast. Stay curious about who they're becoming.`,
      null,
      `What does ${name} need from you that they're not asking for?`,
    ];
    return ideas[dayOfYear() % ideas.length];
  }

  return null;
}

// --- Helpers ---

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

function getAvgMood(journals: JournalEntry[]): number {
  const moods = journals.filter((j) => j.mood).map((j) => j.mood!);
  return moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 3;
}

function getAvgEnergy(journals: JournalEntry[]): number {
  const energies = journals.filter((j) => j.energy).map((j) => j.energy!);
  return energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 3;
}
