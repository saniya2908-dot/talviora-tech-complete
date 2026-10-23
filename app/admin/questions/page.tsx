"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Question = { id: string; question: string; created_at: string };

export default function AdminMentorQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadQuestions = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Sign in with the admin account to view incoming questions.");
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/mentor-questions", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load the question inbox.");
      setQuestions(Array.isArray(payload.questions) ? payload.questions : []);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the question inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions(true);
    const timer = window.setInterval(() => void loadQuestions(false), 15000);
    return () => window.clearInterval(timer);
  }, [loadQuestions]);

  const deleteQuestion = async (question: Question) => {
    if (!window.confirm("Delete this question from the admin inbox? This cannot be undone.")) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Your sign-in expired. Sign in again to manage the inbox.");
      return;
    }
    setDeletingId(question.id);
    try {
      const response = await fetch("/api/admin/mentor-questions", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: question.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete this question.");
      setQuestions((items) => items.filter((item) => item.id !== question.id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this question.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-300">
      <header className="flex flex-col gap-4 border-b border-[rgba(var(--color-burgundy-rgb),0.15)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-burgundy)]">
            <MessageSquareText className="h-4 w-4" /> Admin inbox
          </p>
          <h1 className="font-display-serif text-3xl font-bold text-[var(--color-burgundy)] sm:text-4xl">
            Mentor questions
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Questions only. AI replies and conversation history are not shown here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadQuestions(true)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-burgundy-rgb),0.18)] px-4 py-2 text-sm font-semibold text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
        <span>Updates automatically every 15 seconds.</span>
        <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for inbox…"}</span>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--border-warm)] bg-[var(--surface-rose)] p-4 text-sm text-[var(--text-primary)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-burgundy)]" />
          <div>
            <p>{error}</p>
            {error.includes("migration") && (
              <p className="mt-2">Run <code>supabase/migrations/20261017_mentor_questions_inbox.sql</code> in the Supabase SQL Editor, then grant the admin role to the approved account in Supabase Auth.</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-[var(--border-panel)] bg-[var(--color-warm-ivory)] text-sm text-[var(--text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading questions…
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-panel)] bg-[var(--color-warm-ivory)] p-10 text-center">
          <MessageSquareText className="mx-auto h-8 w-8 text-[var(--color-dusty-rose)]" />
          <h2 className="mt-3 font-display-serif text-xl font-bold text-[var(--color-burgundy)]">No questions yet</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">New mentor questions will appear here.</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {questions.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border-panel)] bg-[var(--color-warm-ivory)] p-4 sm:p-5">
              <div className="min-w-0">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--text-primary)]">{item.question}</p>
                <time className="mt-3 block text-xs text-[var(--text-secondary)]" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </div>
              <button
                type="button"
                aria-label="Delete question"
                title="Delete question"
                disabled={deletingId === item.id}
                onClick={() => void deleteQuestion(item)}
                className="shrink-0 rounded-lg p-2 text-[var(--color-burgundy)] hover:bg-[var(--surface-rose)] disabled:opacity-50"
              >
                {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
