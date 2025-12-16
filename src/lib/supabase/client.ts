import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  // During build time, these might not be available - that's okay for client-only code
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (!url || url === 'https://placeholder.supabase.co' || !key || key === 'placeholder-key') {
    throw new Error("Missing or invalid Supabase environment variables");
  }

  return createBrowserClient(url, key);
}

