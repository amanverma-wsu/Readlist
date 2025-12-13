import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.delete(items).where(eq(items.id, id));

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
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: Partial<typeof items.$inferInsert> = {};
    
    // Only add to updates if explicitly provided and is a boolean
    if (typeof body.isRead === "boolean") updates.isRead = body.isRead;
    if (typeof body.isFavorite === "boolean") updates.isFavorite = body.isFavorite;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "no valid updates provided" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
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