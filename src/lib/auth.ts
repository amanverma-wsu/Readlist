import { headers } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();

  // Try cookie-based session first
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return { user, accessToken: null };
  }

  // Fallback to Authorization bearer token
  const authHeader = headers().get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (token) {
    const result = await supabase.auth.getUser(token);
    if (!result.error && result.data.user) {
      return { user: result.data.user, accessToken: token };
    }
  }

  return { user: null, accessToken: null };
}

