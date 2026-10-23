import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createAuthenticatedSupabase, getAuthenticatedUser, sanitizeInput } from "@/lib/auth-server";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ bookmarks: [], totalCount: 0, persisted: false, isGuest: true });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Bookmark storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  const { data, error } = await db
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Bookmark read failed:", error.message);
    return NextResponse.json({ success: false, error: "Could not load saved bookmarks." }, { status: 503 });
  }

  return NextResponse.json({ bookmarks: data ?? [], totalCount: data?.length ?? 0, persisted: true, isGuest: false });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ success: false, error: "Sign in before saving bookmarks." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Bookmark storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Invalid bookmark payload." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const itemId = sanitizeInput(input.item_id ?? input.id, 100);
    const title = sanitizeInput(input.title, 200);
    const itemType = ["project", "course", "opportunity", "resource"].includes(String(input.item_type))
      ? String(input.item_type)
      : "resource";

    if (!itemId || !title) {
      return NextResponse.json({ success: false, error: "item_id and title are required." }, { status: 400 });
    }

    const metadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? input.metadata
      : {};
    const { data, error } = await db
      .from("bookmarks")
      .upsert(
        { user_id: user.id, item_type: itemType, item_id: itemId, title, metadata },
        { onConflict: "user_id,item_type,item_id" }
      )
      .select("*")
      .single();

    if (error || !data) {
      console.error("Bookmark save failed:", error?.message);
      return NextResponse.json({ success: false, error: "Bookmark was not saved." }, { status: 503 });
    }

    return NextResponse.json({ success: true, bookmark: data, persisted: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save bookmark." }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json({ success: false, error: "Sign in before removing saved bookmarks." }, { status: 401 });
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ success: false, error: "Bookmark storage is unavailable until Supabase is configured." }, { status: 503 });
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const itemId = sanitizeInput(searchParams.get("item_id"), 100);
  const itemType = sanitizeInput(searchParams.get("item_type") || "resource", 50);
  if (!itemId) {
    return NextResponse.json({ success: false, error: "item_id is required." }, { status: 400 });
  }

  const { error } = await db
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .eq("item_type", itemType);

  if (error) {
    console.error("Bookmark removal failed:", error.message);
    return NextResponse.json({ success: false, error: "Bookmark was not removed." }, { status: 503 });
  }

  return NextResponse.json({ success: true, removed: itemId, persisted: true });
}
