"use client";

import { DailyGoals } from "@/components/DailyGoals";
import { WeekGrid } from "@/components/WeekGrid";
import { useRouter } from "next/navigation";

export default function EverydayEventsPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted hover:text-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">Everyday Events</h1>
          <p className="text-sm text-muted">Your daily essentials and suggestions, tailored to you.</p>
        </div>
      </div>

      <WeekGrid />

      <DailyGoals />
    </div>
  );
}
