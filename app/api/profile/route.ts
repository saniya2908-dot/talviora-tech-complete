import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createAuthenticatedSupabase, getAuthenticatedUser, sanitizeInput, sanitizeNumber } from "@/lib/auth-server";

function toClientProfile(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    targetRole: row.target_role,
    experienceLevel: row.experience_level,
    readinessScore: row.readiness_score,
    weeklyHours: row.weekly_hours,
    currentStreakDays: row.current_streak_days,
    verifiedBadgesCount: row.verified_badges_count,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    portfolioSlug: row.portfolio_slug,
    bio: row.bio,
    skills: row.skills,
  };
}

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json(
      { success: false, error: "Sign in to load a personal profile." },
      { status: 401 }
    );
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { success: false, error: "Profile storage is unavailable until Supabase is configured." },
      { status: 503 }
    );
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile read failed:", error.message);
    return NextResponse.json(
      { success: false, error: "Could not load the saved profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, profile: data ? toClientProfile(data) : null });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user.id) {
    return NextResponse.json(
      { success: false, error: "Sign in before saving profile changes." },
      { status: 401 }
    );
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { success: false, error: "Profile storage is unavailable until Supabase is configured." },
      { status: 503 }
    );
  }
  const db = createAuthenticatedSupabase(user);
  if (!db) return NextResponse.json({ success: false, error: "Your sign-in could not be verified." }, { status: 401 });

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
    const updates: Record<string, unknown> = {};
    if (typeof input.name === "string") updates.name = sanitizeInput(input.name, 100);
    if (typeof input.targetRole === "string") updates.target_role = sanitizeInput(input.targetRole, 100);
    if (typeof input.bio === "string") updates.bio = sanitizeInput(input.bio, 1000);
    if (typeof input.experienceLevel === "string") updates.experience_level = sanitizeInput(input.experienceLevel, 50);
    if (typeof input.portfolioSlug === "string") {
      const slug = sanitizeInput(input.portfolioSlug, 50).toLowerCase();
      if (slug && !/^[a-z0-9-]{3,50}$/.test(slug)) {
        return NextResponse.json({ success: false, error: "Portfolio slug must be 3–50 lowercase letters, numbers, or hyphens." }, { status: 400 });
      }
      updates.portfolio_slug = slug || null;
    }
    if (input.weeklyHours !== undefined) {
      const weeklyHours = Number(input.weeklyHours);
      if (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 100) {
        return NextResponse.json({ success: false, error: "Weekly study time must be between 1 and 100 hours, or left blank." }, { status: 400 });
      }
      updates.weekly_hours = weeklyHours;
    }

    if (input.skills && typeof input.skills === "object" && !Array.isArray(input.skills)) {
      updates.skills = Object.fromEntries(
        Object.entries(input.skills).slice(0, 100).map(([skill, value]) => [
          sanitizeInput(skill, 80),
          sanitizeNumber(value, 0, 100, 0),
        ])
      );
    }

    for (const [field, column] of [["githubUrl", "github_url"], ["linkedinUrl", "linkedin_url"]] as const) {
      if (typeof input[field] !== "string") continue;
      const rawUrl = sanitizeInput(input[field], 255);
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") updates[column] = parsed.toString();
      } catch {
        return NextResponse.json({ success: false, error: `${field} must be a valid http or https URL.` }, { status: 400 });
      }
    }

    const { data, error } = await db
      .from("profiles")
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Profile save failed:", error?.message);
      return NextResponse.json(
        { success: false, error: "Profile changes were not saved. Check database configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: toClientProfile(data), persisted: true });
  } catch (err) {
    console.error("Unexpected error in profile POST:", err);
    return NextResponse.json({ success: false, error: "Failed to save profile changes." }, { status: 500 });
  }
}
