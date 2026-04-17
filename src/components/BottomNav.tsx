"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, today } from "@/lib/store";
import { generatePersonalSuggestions, generateFamilySuggestions, generateGrowthSuggestions } from "@/lib/suggestions";
import { generateHouseChores } from "@/app/chores/page";
import { useMemo } from "react";

export function BottomNav() {
  const pathname = usePathname();
  const { data } = useStore();
  const todayStr = today();

  const badges = useMemo(() => {
    // Count today's completed tasks matching Top 3 titles, per domain
    const todayCompletedTitles = (domain: string) =>
      new Set(
        data.tasks
          .filter((t) => {
            if (!t.completed || t.domain !== domain) return false;
            const d = new Date(t.createdAt).toISOString().slice(0, 10);
            return d === todayStr;
          })
          .map((t) => t.title)
      );

    const countRemaining = (suggestions: { title: string }[], domain: string) => {
      const completed = todayCompletedTitles(domain);
      return suggestions.filter((s) => !completed.has(s.title)).length;
    };

    return {
      personal: countRemaining(generatePersonalSuggestions(data, todayStr), "personal"),
      family: countRemaining(generateFamilySuggestions(data, todayStr), "family"),
      chores: countRemaining(generateHouseChores(data, todayStr), "work"),
      growth: countRemaining(generateGrowthSuggestions(data, todayStr), "growth"),
    };
  }, [data, todayStr]);

  const tabs = [
    { href: "/", label: "Home", icon: HomeIcon, badge: 0 },
    { href: "/personal", label: "Personal", icon: PersonalIcon, badge: badges.personal },
    { href: "/family", label: "Family", icon: FamilyIcon, badge: badges.family },
    { href: "/chores", label: "Chores", icon: ChoresIcon, badge: badges.chores },
    { href: "/growth", label: "Growth", icon: GrowthIcon, badge: badges.growth },
  ];

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[60px] ${
                isActive
                  ? "text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <div className="relative">
                <tab.icon active={isActive} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PersonalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function FamilyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChoresIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function GrowthIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
