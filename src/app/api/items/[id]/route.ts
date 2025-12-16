import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(items).where(and(eq(items.id, id), eq(items.userId, user.id)));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Partial<typeof items.$inferInsert> = {};
    
    // Only add to updates if explicitly provided and is a boolean
    if (typeof body.isRead === "boolean") updates.isRead = body.isRead;
    if (typeof body.isFavorite === "boolean") updates.isFavorite = body.isFavorite;
    if (typeof body.isRead === "boolean") {
      updates.readAt = body.isRead ? new Date() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "no valid updates provided" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(items)
      .set(updates)
      .where(and(eq(items.id, id), eq(items.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "item not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}