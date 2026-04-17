import { DomainPage } from "@/components/DomainPage";
import Link from "next/link";

export default function PersonalPage() {
  return (
    <div>
      <DomainPage
        domain="personal"
        title="Personal"
        color="bg-personal"
        description="Health, mindset, habits, and self-care"
      />
      <div className="max-w-lg mx-auto px-4 pb-6">
        <Link
          href="/journal"
          className="flex items-center gap-3 bg-card border border-card-border rounded-xl p-4 hover:border-personal/30 transition-colors"
        >
          <span className="text-xl">📖</span>
          <div>
            <div className="text-sm font-medium">Journal</div>
            <div className="text-xs text-muted">Your growth story, day by day</div>
          </div>
          <svg className="ml-auto text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
