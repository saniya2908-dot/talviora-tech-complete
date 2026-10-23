import { NextResponse } from "next/server";
import { createRequestScopedSupabase, isSupabaseConfigured } from "@/lib/supabase";

function getAllowedAdminEmails() {
  return new Set(
    (process.env.CHAT_INBOX_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function getAdminClient(req: Request) {
  if (!isSupabaseConfigured) {
    return { response: NextResponse.json({ error: "Question inbox storage is not configured." }, { status: 503 }) };
  }

  const authorization = req.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = match?.[1]?.trim();
  if (!accessToken || accessToken.length > 8192) {
    return { response: NextResponse.json({ error: "Sign in with the admin account to view mentor questions." }, { status: 401 }) };
  }

  const client = createRequestScopedSupabase(accessToken);
  if (!client) {
    return { response: NextResponse.json({ error: "Question inbox storage is not configured." }, { status: 503 }) };
  }

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Your sign-in could not be verified. Please sign in again." }, { status: 401 }) };
  }

  const allowedEmails = getAllowedAdminEmails();
  const email = data.user.email?.trim().toLowerCase() || "";
  const hasAdminClaim = data.user.app_metadata?.role === "admin";
  if (!email || !allowedEmails.has(email) || !hasAdminClaim) {
    return { response: NextResponse.json({ error: "This account is not allowed to view mentor questions. Check the Render admin email allowlist and set app_metadata.role to admin for this account in Supabase." }, { status: 403 }) };
  }

  return { client };
}

export async function GET(req: Request) {
  const auth = await getAdminClient(req);
  if ("response" in auth) return auth.response;

  const { data, error } = await auth.client
    .from("mentor_questions")
    .select("id, question, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Admin mentor inbox read failed:", error.message);
    return NextResponse.json({ error: "Could not load mentor questions. Confirm the inbox migration is installed." }, { status: 503 });
  }

  return NextResponse.json({ questions: data || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request) {
  const auth = await getAdminClient(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>).id
    : null;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "A valid question ID is required." }, { status: 400 });
  }

  const { error } = await auth.client.from("mentor_questions").delete().eq("id", id);
  if (error) {
    console.error("Admin mentor question delete failed:", error.message);
    return NextResponse.json({ error: "Could not delete that question." }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
