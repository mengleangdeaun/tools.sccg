import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { checkinAsset } from "@/lib/assets-store";
import { errorStatus, SheetError } from "@/lib/sheets/core";

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("assets.custody");
    const body = await req.json();
    if (!body.asset_id) throw new SheetError("Asset ID is required.", 400);

    const asset = await checkinAsset(body.asset_id, body, member.email);
    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to checkin asset";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

