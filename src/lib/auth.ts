/**
 * Auth Helper
 * Extracts user from session (cookie) or Authorization header (API calls)
 */
import { headers } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();

  // Try cookie-based session first (browser requests)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return { user, accessToken: null };

  // Fallback to Bearer token (API requests from client)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const result = await supabase.auth.getUser(token);
    if (!result.error && result.data.user) {
      return { user: result.data.user, accessToken: token };
    }
  }

  return { user: null, accessToken: null };
}

