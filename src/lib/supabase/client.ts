/**
 * Supabase Browser Client
 * Creates a singleton client for client-side auth operations
 */
import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  // SSR guard - return null during server-side rendering
  if (typeof window === "undefined") return null as any;

  // Return cached instance to avoid recreating client
  if (supabaseClient) return supabaseClient;

  // Config injected by layout.tsx at runtime
  const url = (window as any).__SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = (window as any).__SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase configuration");
  }

  supabaseClient = createBrowserClient(url, key);
  return supabaseClient;
}

