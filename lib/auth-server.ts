import { createRequestScopedSupabase, supabase } from "./supabase";

export interface AuthenticatedUser {
  id: string | null;
  email?: string;
  isGuest: boolean;
  accessToken?: string;
}

/**
 * Extracts and verifies the authenticated user from the incoming HTTP request.
 * Supports:
 *  1. Authorization: Bearer <jwt> header
 *  2. No identity for unauthenticated requests. Guests can explore public/sample
 *     content, but personal records are never attributed to a shared demo user.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthenticatedUser> {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token && token !== "undefined" && token !== "null") {
        const { data, error } = await supabase.auth.getUser(token);
        if (data?.user && !error) {
          return {
            id: data.user.id,
            email: data.user.email,
            isGuest: false,
            accessToken: token,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Auth token verification error:", err);
  }

  return {
    id: null,
    isGuest: true,
  };
}

/** Create a Supabase client scoped to the verified user's JWT so RLS sees auth.uid(). */
export function createAuthenticatedSupabase(user: AuthenticatedUser) {
  return user.accessToken ? createRequestScopedSupabase(user.accessToken) : null;
}

/**
 * Sanitizes text input to prevent injection attacks and unreasonable payload sizes.
 */
export function sanitizeInput(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // basic tag stripping
    .trim();
}

/**
 * Validates a numeric value within acceptable bounds.
 */
export function sanitizeNumber(input: unknown, min = 0, max = 100, fallback = 0): number {
  const num = Number(input);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}
