import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Readlist - Save & Search Links",
  description: "Save links, search fast, read later. A beautiful self-hosted link manager.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
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
