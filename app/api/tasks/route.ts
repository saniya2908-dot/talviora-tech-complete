import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createAuthenticatedSupabase, getAuthenticatedUser, sanitizeInput, sanitizeNumber } from "@/lib/auth-server";

const taskColumns = ["backlog", "in-progress", "completed"] as const;
type TaskColumn = (typeof taskColumns)[number];

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ tasks: [], totalCount: 0, persisted: false, isGuest: true });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Task storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  const { data, error } = await db
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Task read failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not load saved tasks." }, { status: 503 });
  }

  return NextResponse.json({ tasks: data ?? [], totalCount: data?.length ?? 0, persisted: true, isGuest: false });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ success: false, error: "Sign in before syncing tasks." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Task storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid task payload format." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const title = sanitizeInput(input.title, 200);
    if (!title) return NextResponse.json({ success: false, error: "Task title is required." }, { status: 400 });

    const column = taskColumns.includes(input.column as TaskColumn) ? input.column as TaskColumn : "backlog";
    const task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title,
      category: sanitizeInput(input.category || "General", 50),
      hours: sanitizeNumber(input.hours, 0, 40, 0),
      column,
    };

    const { data, error } = await db.from("tasks").insert(task).select("*").single();
    if (error || !data) {
      console.error("Task create failed:", error?.message);
      return NextResponse.json({ success: false, error: "Task was not saved to your account." }, { status: 503 });
    }

    return NextResponse.json({ success: true, task: data, persisted: true }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create task." }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ success: false, error: "Sign in before syncing task changes." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Task storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid task update." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const id = sanitizeInput(input.id, 100);
    const column = input.column as TaskColumn;
    if (!id || !taskColumns.includes(column)) {
      return NextResponse.json({ success: false, error: "A task id and valid column are required." }, { status: 400 });
    }

    const { data, error } = await db
      .from("tasks")
      .update({ column, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      console.error("Task update failed:", error?.message);
      return NextResponse.json({ success: false, error: "Task changes were not saved." }, { status: 503 });
    }

    return NextResponse.json({ success: true, task: data, persisted: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update task." }, { status: 400 });
  }
}
