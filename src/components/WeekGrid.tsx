"use client";

import { useStore, today } from "@/lib/store";
import { countCompletedOn, expectedTotalOn, getWeekDates, monthStats } from "@/lib/dailyGoals";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeekGrid() {
  const { data } = useStore();
  const todayStr = today();
  const weekDates = getWeekDates(todayStr);
  const stats = monthStats(data, todayStr);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">This Week</h2>
        <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-[11px] font-medium">
          {stats.daysPerfect}/{stats.totalDays} this month
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((dateStr, i) => {
          const done = countCompletedOn(data, dateStr);
          const total = expectedTotalOn(data, dateStr);
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const isPerfect = !isFuture && done >= total && total > 0;
          const partial = !isFuture && done > 0 && done < total;
          const dayNum = new Date(dateStr + "T00:00:00").getDate();

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <div className="text-[10px] text-muted">{DAY_LABELS[i]}</div>
              <div
                className={`w-9 h-9 rounded-lg border flex flex-col items-center justify-center text-[10px] ${
                  isFuture
                    ? "border-dashed border-card-border opacity-40"
                    : isPerfect
                    ? "bg-success border-success text-white"
                    : partial
                    ? "bg-card border-warning/40 text-foreground"
                    : "bg-card border-card-border text-muted"
                } ${isToday ? "ring-2 ring-accent/40" : ""}`}
              >
                {isPerfect ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <>
                    <div className="font-bold text-xs leading-none">{dayNum}</div>
                    {!isFuture && total > 0 && (
                      <div className="text-[8px] text-muted leading-none mt-0.5">
                        {done}/{total}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-success">{stats.daysPerfect}</div>
          <div className="text-[10px] text-muted">Perfect Days</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-warning">{stats.daysAttempted - stats.daysPerfect}</div>
          <div className="text-[10px] text-muted">Partial Days</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-muted">{stats.totalDays - stats.daysAttempted}</div>
          <div className="text-[10px] text-muted">Missed Days</div>
        </div>
      </div>
    </section>
  );
}
