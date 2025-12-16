import "./globals.css";
import { Providers } from "./providers";
import { Viewport } from "next";

// Force dynamic rendering so env vars are read at runtime
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Readlist - Save & Search Links",
  description: "Save links, search fast, read later. A beautiful self-hosted link manager.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="light dark" />
        {supabaseUrl && supabaseKey && (
          <script dangerouslySetInnerHTML={{
            __html: `window.__SUPABASE_URL=${JSON.stringify(supabaseUrl)};window.__SUPABASE_KEY=${JSON.stringify(supabaseKey)};`
          }} />
        )}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
