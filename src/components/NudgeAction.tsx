"use client";

import { useState } from "react";
import type { Nudge } from "@/lib/store";

interface NudgeActionProps {
  nudge: Nudge;
  personName?: string;
  onSave: (response: string, mood: number) => void;
  onClose: () => void;
}

const CATEGORY_PROMPTS: Record<Nudge["type"], { title: string; placeholder: string; question: string }> = {
  relationship: {
    title: "Connection Log",
    placeholder: "What did you do? How did it go? How are they doing?",
    question: "How did this connection feel?",
  },
  chore: {
    title: "Task Complete",
    placeholder: "What did you do? How long did it take? How does it feel to have it done?",
    question: "How do you feel about getting this done?",
  },
  service: {
    title: "Act of Service",
    placeholder: "What did you do? How did they react? What did it mean to them?",
    question: "How did it feel to serve?",
  },
  self: {
    title: "Self Check-in",
    placeholder: "What did you do? What did you learn about yourself?",
    question: "How are you feeling?",
  },
  gratitude: {
    title: "Gratitude Entry",
    placeholder: "What are you grateful for? Why does it matter? How does it make you feel?",
    question: "How does this gratitude make you feel?",
  },
};

export function NudgeAction({ nudge, personName, onSave, onClose }: NudgeActionProps) {
  const [response, setResponse] = useState("");
  const [mood, setMood] = useState(4);
  const prompts = CATEGORY_PROMPTS[nudge.type];

  function handleSave() {
    onSave(response.trim(), mood);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center">
      <div className="bg-background w-full max-w-lg rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{prompts.title}</h2>
            <button onClick={onClose} className="text-muted hover:text-foreground p-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Original nudge */}
          <div className="bg-card border border-card-border rounded-xl p-3">
            <div className="text-xs text-muted uppercase font-semibold mb-1">Nudge</div>
            <p className="text-sm">{nudge.message}</p>
            {personName && (
              <div className="text-xs text-muted mt-1">About: {personName}</div>
            )}
          </div>

          {/* Response */}
          <div>
            <label className="text-sm font-medium mb-2 block">What did you do?</label>
            <textarea
              placeholder={prompts.placeholder}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent resize-none"
              autoFocus
            />
          </div>

          {/* Mood */}
          <div>
            <label className="text-sm font-medium mb-2 block">{prompts.question}</label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMood(n)}
                  className={`w-12 h-12 rounded-full text-xl flex items-center justify-center transition-all ${
                    mood === n ? "bg-accent text-white scale-110" : "bg-card border border-card-border"
                  }`}
                >
                  {["😞", "😕", "😐", "🙂", "😄"][n - 1]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={handleSave}
              disabled={!response.trim()}
              className="flex-1 py-3 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Save to Journal
            </button>
            <button
              onClick={() => { onSave("", mood); }}
              className="px-4 py-3 text-muted text-sm"
            >
              Skip & Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
