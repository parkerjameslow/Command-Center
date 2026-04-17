"use client";

import { DomainPage } from "@/components/DomainPage";
import { Top3Suggestions } from "@/components/Top3Suggestions";
import { CompletedCard } from "@/components/CompletedCard";
import { useStore, today } from "@/lib/store";
import { generateGrowthSuggestions } from "@/lib/suggestions";
import { useMemo } from "react";

export default function GrowthPage() {
  const { data } = useStore();
  const todayStr = today();
  const suggestions = useMemo(() => generateGrowthSuggestions(data, todayStr), [data, todayStr]);

  return (
    <div>
      <DomainPage
        domain="growth"
        title="Growth"
        color="bg-growth"
        description="Learning, goals, and personal development"
      />
      <Top3Suggestions
        title="Today's Top 3"
        subtitle="Moves that compound into the person you want to become."
        suggestions={suggestions}
        domain="growth"
        journalCategory="lesson"
      />

      <CompletedCard domain="growth" />
    </div>
  );
}
