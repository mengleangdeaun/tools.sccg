import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember, requirePermission } from "@/lib/auth/dal";
import { addAssetComment, getAssetActivity } from "@/lib/assets-store";
import { errorStatus, SheetError } from "@/lib/sheets/core";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("assets.view");
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("asset_id");
    if (!assetId) throw new SheetError("Asset ID is required.", 400);

    const activity = await getAssetActivity(assetId);
    return NextResponse.json({ success: true, activity });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load timeline activity";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    const body = await req.json();
    if (!body.asset_id) throw new SheetError("Asset ID is required.", 400);
    if (!body.body?.trim()) throw new SheetError("Comment text is required.", 400);

    await addAssetComment(body.asset_id, body.body, member.email);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add comment";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

