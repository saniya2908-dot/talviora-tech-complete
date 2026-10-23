"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
  Loader2,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setIsError(true);
      setMsg("Authentication is unavailable until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.");
      return;
    }
    setLoading(true);
    setMsg("");
    setIsError(false);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMsg("Verification link sent! Please check your email.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMsg("Authentication successful! Redirecting...");
        const destination = data.user?.app_metadata?.role === "admin" ? "/admin/questions" : "/";
        setTimeout(() => router.push(destination), 1200);
      }
    } catch (err: any) {
      console.warn("Auth warning:", err);
      // Even if network or Supabase is offline, provide friendly fallback
      setIsError(true);
      setMsg(err?.message || "Authentication service temporarily unreachable. You can continue in Guest Mode below.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    router.push("/");
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6 animate-in fade-in duration-300">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-burgundy)] border border-[var(--color-dusty-rose)]/40 flex items-center justify-center text-[var(--color-warm-ivory)] font-serif font-bold text-lg mx-auto shadow-sm">
          TT
        </div>
        <h1 className="text-2xl font-serif font-bold text-[var(--color-burgundy)] tracking-wider">
          TALVIORA TECH
        </h1>
        <p className="text-xs text-[var(--color-burgundy)]/80">
          Autonomous Career Intelligence & Learning Ecosystem
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-[var(--color-warm-ivory)] rounded-2xl p-6 sm:p-8 space-y-6 border border-[var(--color-creme-latte)] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-creme-latte)] text-xs">
          <div className="flex gap-4">
            <button
              type="button"
              aria-pressed={!isSignUp}
              onClick={() => {
                setIsSignUp(false);
                setMsg("");
              }}
              className={`font-semibold pb-1 cursor-pointer transition ${
                !isSignUp
                  ? "text-[var(--color-burgundy)] border-b-2 border-[var(--color-burgundy)]"
                  : "text-[var(--color-burgundy)]/60 hover:text-[var(--color-burgundy)]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              aria-pressed={isSignUp}
              onClick={() => {
                setIsSignUp(true);
                setMsg("");
              }}
              className={`font-semibold pb-1 cursor-pointer transition ${
                isSignUp
                  ? "text-[var(--color-burgundy)] border-b-2 border-[var(--color-burgundy)]"
                  : "text-[var(--color-burgundy)]/60 hover:text-[var(--color-burgundy)]"
              }`}
            >
              Create Account
            </button>
          </div>

          <span className="flex items-center gap-1 text-[11px] text-[var(--color-burgundy)] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-flowering-chestnut)]" />
            <span>Supabase Auth</span>
          </span>
        </div>

        {!isSupabaseConfigured && (
          <p className="rounded-xl border border-[var(--border-warm)] bg-[var(--surface-rose)] p-3 text-xs leading-relaxed text-[var(--text-primary)]" role="status">
            Authentication is not configured in this environment. You can explore the sample workspace; account sign-in and data sync will remain unavailable until Supabase is configured.
          </p>
        )}

        {msg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              isError
                ? "bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[var(--color-dusty-rose)]/50"
                : "bg-[var(--surface-rose)] text-[var(--color-burgundy)] border border-[var(--color-dusty-rose)]/40"
            }`}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
              <label htmlFor="auth-email" className="text-xs font-bold text-[var(--color-burgundy)]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--color-flowering-chestnut)] absolute left-3 top-3" />
              <input
                type="email"
                id="auth-email"
                required
                placeholder="developer@talviora.tech"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[var(--color-warm-ivory)] border border-[var(--color-creme-latte)] text-[var(--color-burgundy)] placeholder:text-[var(--color-flowering-chestnut)] focus:border-[var(--color-burgundy)] focus:outline-hidden transition shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
              <label htmlFor="auth-password" className="text-xs font-bold text-[var(--color-burgundy)]">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[var(--color-flowering-chestnut)] absolute left-3 top-3" />
              <input
                type="password"
                id="auth-password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[var(--color-warm-ivory)] border border-[var(--color-creme-latte)] text-[var(--color-burgundy)] placeholder:text-[var(--color-burgundy)]/40 focus:border-[var(--color-burgundy)] focus:outline-hidden transition shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="btn-burgundy w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSignUp ? (
              <span>Create Free Candidate Account</span>
            ) : (
              <span>Authenticate Session</span>
            )}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[var(--color-creme-latte)]"></div>
          <span className="flex-shrink mx-3 text-[10px] text-[var(--color-burgundy)]/70 uppercase font-semibold">
            or sample preview
          </span>
          <div className="flex-grow border-t border-[var(--color-creme-latte)]"></div>
        </div>

        <button
          onClick={handleGuestMode}
          className="btn-secondary-coffee w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <User className="w-4 h-4 text-[var(--color-burgundy)]" />
          <span>Explore sample workspace</span>
        </button>
      </div>
    </div>
  );
}
