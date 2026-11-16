import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { checkoutAsset } from "@/lib/assets-store";
import { errorStatus, SheetError } from "@/lib/sheets/core";

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("assets.custody");
    const body = await req.json();
    if (!body.asset_id) throw new SheetError("Asset ID is required.", 400);
    if (!body.custodian_email) throw new SheetError("Custodian email is required.", 400);

    const asset = await checkoutAsset(body.asset_id, body, member.email);
    return NextResponse.json({ success: true, asset });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to checkout asset";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

