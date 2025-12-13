import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { desc } from "drizzle-orm";

// Compile regex patterns once for better performance
const OG_TITLE_REGEX = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i;
const TITLE_REGEX = /<title[^>]*>([^<]+)<\/title>/i;
const OG_DESC_REGEX = /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i;
const DESC_REGEX = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i;
const FLEX_DESC_REGEX = /<meta\s+(?:property|name)=["'](?:og:)?description["']\s+content=["']([^"']{10,}?)["']/i;
const DESC_FIRST_REGEX = /<meta\s+content=["']([^"']{10,}?)["']\s+(?:property|name)=["'](?:og:)?description["']/i;
const OG_IMAGE_REGEX = /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i;
const TWITTER_IMAGE_REGEX = /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i;

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

    // Extract title
    let title = html.match(OG_TITLE_REGEX)?.[1]?.trim();
    if (!title) {
      title = html.match(TITLE_REGEX)?.[1]?.trim();
    }
    if (title) {
      title = title.replace(/\s*[-|]\s*(.*?)$/, "").trim();
    }

    // Extract description
    let description = html.match(OG_DESC_REGEX)?.[1]?.trim();
    if (!description) description = html.match(DESC_REGEX)?.[1]?.trim();
    if (!description) description = html.match(FLEX_DESC_REGEX)?.[1]?.trim();
    if (!description) description = html.match(DESC_FIRST_REGEX)?.[1]?.trim();

    // Extract image
    let image = html.match(OG_IMAGE_REGEX)?.[1]?.trim();
    if (!image) image = html.match(TWITTER_IMAGE_REGEX)?.[1]?.trim();

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
  try {
    const rows = await db.select().from(items).orderBy(desc(items.createdAt));
    return NextResponse.json(rows, { 
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
