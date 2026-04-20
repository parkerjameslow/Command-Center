"use client";

import { useAuth } from "./AuthProvider";
import { useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(error);
      setSubmitting(false);
    } else if (isSignUp) {
      // Auto sign-in after sign-up
      const signInResult = await signIn(email, password);
      if (signInResult.error) setError(signInResult.error);
      setSubmitting(false);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="text-muted text-sm leading-relaxed">
            Become a better husband, father, friend, and human —
            one intentional day at a time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder={isSignUp ? "Create a password (6+ characters)" : "Password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
          />

          {error && (
            <div className="text-danger text-xs text-center py-1">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Please wait..." : isSignUp ? "Get Started" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="w-full text-center text-xs text-muted hover:text-foreground"
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        <p className="text-[11px] text-muted text-center leading-relaxed">
          Your data is private and yours alone. You&apos;ll only need to sign in once per device —
          your phone&apos;s lock screen keeps it safe.
        </p>
      </div>
    </div>
  );
}
