"use client";

import { useAuth } from "./AuthProvider";
import { useState } from "react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // prevent double-tap
    setError("");
    setSuccess("");
    setSubmitting(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(error);
      setSubmitting(false);
    } else if (isSignUp) {
      setSuccess("Account created! Signing you in...");
      // Auto sign-in after sign-up
      const signInResult = await signIn(email, password);
      if (signInResult.error) {
        setError(signInResult.error);
        setSuccess("");
      }
      setSubmitting(false);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-muted text-sm mt-1">Your personal life operating system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-card border border-card-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
          />

          {error && (
            <div className="text-danger text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-success text-sm text-center">{success}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
          className="w-full text-center text-sm text-muted"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
