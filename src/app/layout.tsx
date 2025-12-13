import "./globals.css";
import { Providers } from "./providers";
import { Viewport } from "next";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
