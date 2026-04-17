"use client";

import { DomainPage } from "@/components/DomainPage";
import { Top3Suggestions } from "@/components/Top3Suggestions";
import { useStore, today } from "@/lib/store";
import { generatePersonalSuggestions } from "@/lib/suggestions";
import { useMemo } from "react";
import Link from "next/link";

export default function PersonalPage() {
  const { data } = useStore();
  const todayStr = today();
  const suggestions = useMemo(() => generatePersonalSuggestions(data, todayStr), [data, todayStr]);

  const todayEntries = [
    ...(data.journalLogs || []).filter((j) => j.date === todayStr),
    ...data.journal.filter((j) => j.date === todayStr),
    ...data.connectionLogs.filter((c) => c.date === todayStr && c.note),
  ].length;

  return (
    <div>
      <DomainPage
        domain="personal"
        title="Personal"
        color="bg-personal"
        description="Health, mindset, habits, and self-care"
      />

      <Top3Suggestions
        title="Today's Top 3"
        subtitle="Highest-impact personal growth moves based on your patterns."
        suggestions={suggestions}
        domain="personal"
        journalCategory="reflection"
      />

      <div className="max-w-lg mx-auto px-4 pb-6">
        <Link
          href="/journal"
          className="flex items-center justify-between bg-card border border-card-border rounded-xl p-4 hover:border-personal/30 transition-colors"
        >
          <div>
            <div className="text-sm font-medium">Journal</div>
            <div className="text-xs text-muted">
              {todayEntries > 0 ? `${todayEntries} entries today` : "No entries today"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {todayEntries > 0 && (
              <span className="text-sm font-bold text-accent">{todayEntries}</span>
            )}
            <svg className="text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}
