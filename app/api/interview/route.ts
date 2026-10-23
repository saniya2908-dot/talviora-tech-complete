import { NextResponse } from "next/server";
import { evaluateInterviewResponse, isGeminiConfigured } from "@/lib/gemini";
import { interviewQuestionsList } from "@/lib/career-data";
import { createAuthenticatedSupabase, getAuthenticatedUser, sanitizeInput } from "@/lib/auth-server";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  return NextResponse.json({ questions: interviewQuestionsList, totalCount: interviewQuestionsList.length });
}

export async function POST(req: Request) {
  const rateLimit = checkRateLimit(req, { limit: 15, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many interview feedback requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }
  if (!isGeminiConfigured) {
    return NextResponse.json(
      { success: false, error: "Interview feedback is unavailable until GEMINI_API_KEY is configured on the server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON request payload." }, { status: 400 });
  }

  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid request payload format." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const answer = sanitizeInput(input.answer, 4000);
    if (answer.length < 5) {
      return NextResponse.json({ success: false, error: "Please provide a substantive answer (at least 5 characters) to evaluate." }, { status: 400 });
    }

    const role = sanitizeInput(input.role || "", 100);
    const question = sanitizeInput(input.question || "", 500);
    if (!role || !question) {
      return NextResponse.json({ success: false, error: "Choose an interview role and question." }, { status: 400 });
    }

    const evaluation = await evaluateInterviewResponse({ role, question, userAnswer: answer });
    if (!Number.isFinite(evaluation.rating) || !Array.isArray(evaluation.strengths)) {
      return NextResponse.json({ success: false, error: "The AI provider returned invalid feedback. Please retry." }, { status: 502 });
    }

    const user = await getAuthenticatedUser(req);
    let persisted = false;
    let persistenceMessage = "Feedback was generated but was not saved to an account.";
    const db = createAuthenticatedSupabase(user);
    if (user.id && isSupabaseConfigured && db) {
      const { error } = await db.from("interview_sessions").insert({
        user_id: user.id,
        role,
        question,
        candidate_answer: answer,
        rating: evaluation.rating,
        strengths: evaluation.strengths,
        areas_for_improvement: evaluation.areasForImprovement,
        ideal_talking_points: evaluation.idealTalkingPoints,
        verdict: evaluation.verdict,
        evaluated_at: new Date().toISOString(),
      });
      persisted = !error;
      persistenceMessage = error
        ? "Feedback was generated but could not be saved to your account."
        : "Feedback was saved to your account.";
      if (error) console.error("Interview feedback save failed:", error.message);
    }

    return NextResponse.json({
      success: true,
      evaluatedAt: new Date().toISOString(),
      provider: "Google Gemini",
      persisted,
      persistenceMessage,
      ...evaluation,
    });
  } catch (error) {
    console.error("Interview evaluation failed:", error);
    return NextResponse.json(
      { success: false, error: "Interview feedback could not be generated. Check AI provider configuration and retry." },
      { status: 502 }
    );
  }
}
