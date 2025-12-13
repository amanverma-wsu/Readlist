import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { desc } from "drizzle-orm";

async function fetchMetadata(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!res.ok) return {};

    const html = await res.text();

    // Extract title - try multiple approaches
    let title: string | null = null;

    // Try og:title first
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );
    title = ogTitleMatch?.[1]?.trim() || null;

    // Fall back to <title> tag
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch?.[1]?.trim() || null;
    }

    // Clean up title (remove common suffixes like " - Website", " | Company")
    if (title) {
      title = title
        .replace(/\s*[-|]\s*(.*?)$/, "") // Remove everything after - or |
        .trim();
    }

    // Extract description from meta tags - try multiple approaches
    let description: string | null = null;

    // Try og:description first
    const ogDescMatch = html.match(
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
    );
    description = ogDescMatch?.[1]?.trim() || null;

    // Fall back to name="description"
    if (!description) {
      const descMatch = html.match(
        /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
      );
      description = descMatch?.[1]?.trim() || null;
    }

    // Try with more flexible whitespace handling
    if (!description) {
      const flexDescMatch = html.match(
        /<meta\s+(?:property|name)=["'](?:og:)?description["']\s+content=["']([^"']{10,}?)["']/i
      );
      description = flexDescMatch?.[1]?.trim() || null;
    }

    // Try with content attribute first
    if (!description) {
      const contentFirstMatch = html.match(
        /<meta\s+content=["']([^"']{10,}?)["']\s+(?:property|name)=["'](?:og:)?description["']/i
      );
      description = contentFirstMatch?.[1]?.trim() || null;
    }

    // Extract image from og:image, twitter:image, or apple-touch-icon
    let image: string | null = null;

    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    image = ogImageMatch?.[1]?.trim() || null;

    if (!image) {
      const twitterImageMatch = html.match(
        /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i
      );
      image = twitterImageMatch?.[1]?.trim() || null;
    }

    return {
      title: title || null,
      description: description || null,
      image: image || null,
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = String(body?.url ?? "");

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let domain: string | null = null;
    try {
      domain = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    // Fetch metadata
    const metadata = await fetchMetadata(url);

    const [row] = await db
      .insert(items)
      .values({
        url,
        domain,
        title: metadata.title || null,
        description: metadata.description || null,
        image: metadata.image || null,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function GET() {
  const rows = await db.select().from(items).orderBy(desc(items.createdAt));
  return NextResponse.json(rows);
}
