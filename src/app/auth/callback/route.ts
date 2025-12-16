import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");

  if (!code) {
    // Missing code from email link
    return NextResponse.redirect(new URL("/?auth=missing_code", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Could not exchange code for a session
    return NextResponse.redirect(new URL("/?auth=callback_error", request.url));
  }

  // If this is a password reset (recovery), redirect to reset password page
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  // Email confirmed and session set; send back to app
  return NextResponse.redirect(new URL("/?auth=confirmed", request.url));
}
