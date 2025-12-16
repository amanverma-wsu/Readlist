/**
 * Items API - GET (list) and POST (create) endpoints
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

// Pre-compiled regex patterns for metadata extraction (performance optimization)
const META_PATTERNS = {
  ogTitle: /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
  title: /<title[^>]*>([^<]+)<\/title>/i,
  ogDesc: /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
  metaDesc: /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  ogImage: /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
  twitterImage: /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
};

/** Fetches and parses OG metadata from a URL with 5s timeout */
async function fetchMetadata(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Readlist/1.0)" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!res.ok) return {};
    const html = await res.text();

    // Extract title (prefer OG, fallback to <title>)
    let title = html.match(META_PATTERNS.ogTitle)?.[1]?.trim()
      || html.match(META_PATTERNS.title)?.[1]?.trim();
    if (title) title = title.replace(/\s*[-|]\s*.*$/, "").trim(); // Remove site suffix

    // Extract description
    const description = html.match(META_PATTERNS.ogDesc)?.[1]?.trim()
      || html.match(META_PATTERNS.metaDesc)?.[1]?.trim();

    // Extract image
    const image = html.match(META_PATTERNS.ogImage)?.[1]?.trim()
      || html.match(META_PATTERNS.twitterImage)?.[1]?.trim();

    return { title: title || null, description: description || null, image: image || null };
  } catch {
    return {};
  }
}

/** POST /api/items - Save a new link */
export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

    // Validate and extract domain
    let domain: string;
    try {
      domain = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }

    // Fetch metadata and save
    const metadata = await fetchMetadata(url);
    const [row] = await db.insert(items).values({
      userId: user.id,
      url,
      domain,
      ...metadata,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST /api/items error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

/** GET /api/items - List user's saved links */
export async function GET() {
  try {
    const { user } = await requireUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const rows = await db.select()
      .from(items)
      .where(eq(items.userId, user.id))
      .orderBy(desc(items.createdAt));

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("GET /api/items error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
