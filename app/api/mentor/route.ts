import { NextResponse } from "next/server";
import { streamMentorReply, isGeminiConfigured } from "@/lib/gemini";
import { sanitizeInput } from "@/lib/auth-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const rateLimit = checkRateLimit(req, { limit: 15, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many AI mentor requests. Please wait a moment before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }
  if (!isGeminiConfigured) {
    return NextResponse.json(
      { success: false, error: "AI mentor is unavailable until GEMINI_API_KEY is configured on the server." },
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
      return NextResponse.json({ success: false, error: "Invalid mentor request." }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const message = sanitizeInput(data.message, 4000);
    if (message.length < 3) {
      return NextResponse.json({ success: false, error: "Enter a question of at least 3 characters." }, { status: 400 });
    }

    // Persist only the new question. The inbox never receives AI replies or chat history.
    if (isSupabaseConfigured) {
      const { error: inboxError } = await supabase.from("mentor_questions").insert({ question: message });
      if (inboxError) console.error("Mentor question inbox save failed:", inboxError.message);
    }

    const rawHistory = Array.isArray(data.history) ? data.history : [];
    const history: ChatMessage[] = rawHistory
      .slice(-40)
      .filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item))
      )
      .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .map((item) => ({ role: item.role as ChatMessage["role"], content: sanitizeInput(item.content, 4000) }))
      .filter((item) => item.content.length > 0);

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const text of streamMentorReply(message, history)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (error) {
          console.error("Mentor request failed:", error);
          const providerStatus = (error as { status?: number })?.status;
          const errorMessage = error instanceof Error ? error.message : String(error);
          const isBusy = providerStatus === 429 || providerStatus === 503 || /UNAVAILABLE|high demand/i.test(errorMessage);
          const publicError = isBusy
            ? "The AI is busy right now. Your message is saved; please try again shortly."
            : "The AI could not finish this reply. Your message is saved; please try again.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: publicError })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    console.error("Mentor request failed before streaming:", error);
    return NextResponse.json(
      { success: false, error: "The AI could not start this reply. Your message is saved; please try again." },
      { status: 502 }
    );
  }
}
