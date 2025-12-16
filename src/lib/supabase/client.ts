import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build, these might not be available - that's okay for client-only code
    if (typeof window === 'undefined') {
      return null as any;
    }
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient(url, key);
}

