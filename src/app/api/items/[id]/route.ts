/**
 * Single Item API - DELETE and PATCH endpoints
 */
import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/** DELETE /api/items/:id - Remove a saved link */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { user } = await requireUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Only delete if owned by user (security)
    await db.delete(items).where(and(eq(items.id, id), eq(items.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/items/:id error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

/** PATCH /api/items/:id - Update isRead or isFavorite status */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { user } = await requireUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Build updates object from valid boolean fields
    const updates: Partial<typeof items.$inferInsert> = {};
    if (typeof body.isRead === "boolean") {
      updates.isRead = body.isRead;
      updates.readAt = body.isRead ? new Date() : null; // Track read timestamp
    }
    if (typeof body.isFavorite === "boolean") {
      updates.isFavorite = body.isFavorite;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "no valid updates provided" }, { status: 400 });
    }

    const [updated] = await db.update(items)
      .set(updates)
      .where(and(eq(items.id, id), eq(items.userId, user.id)))
      .returning();

    if (!updated) return NextResponse.json({ error: "item not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH /api/items/:id error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}