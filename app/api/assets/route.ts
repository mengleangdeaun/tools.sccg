import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember, requirePermission } from "@/lib/auth/dal";
import { getAllAssetData, saveAsset } from "@/lib/assets-store";
import { errorStatus, SheetError } from "@/lib/sheets/core";
import { patchRow } from "@/lib/sheets/table";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

export async function GET() {
  try {
    await requirePermission("assets.view");
    const data = await getAllAssetData();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return fail(error, "Failed to load assets");
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("assets.create");
    const body = await req.json();
    const asset = await saveAsset(body, member.email);
    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    return fail(error, "Failed to save asset");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const member = await requirePermission("assets.edit");
    const body = await req.json();
    if (!body.id) throw new SheetError("Asset ID is required.", 400);
    const asset = await saveAsset(body, member.email);
    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    return fail(error, "Failed to update asset");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("assets.delete");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) throw new SheetError("Asset ID is required.", 400);

    await patchRow("Assets", id, { archived_at: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to archive asset");
  }
}

