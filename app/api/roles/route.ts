import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { errorStatus } from "@/lib/sheets/core";
import { archiveRole, saveRole } from "@/lib/team-store";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: errorStatus(error) });

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("roles.manage");
    await saveRole(actor, await req.json());
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to save role");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await requirePermission("roles.manage");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Role ID is required." }, { status: 400 });
    await archiveRole(actor, id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to delete role");
  }
}
