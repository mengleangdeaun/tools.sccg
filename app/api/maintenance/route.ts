import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember, requirePermission } from "@/lib/auth/dal";
import { logAssetMaintenance } from "@/lib/assets-store";
import { errorStatus, SheetError } from "@/lib/sheets/core";
import { loadAll, patchRow } from "@/lib/sheets/table";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("assets.view");
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("asset_id");
    const tabs = await loadAll();
    let records = tabs.Asset_Maintenance.rows;
    if (assetId) {
      records = records.filter((r) => r.asset_id === assetId);
    }
    return NextResponse.json({ success: true, maintenance: records });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load maintenance records";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("assets.maintenance");
    const body = await req.json();
    const record = await logAssetMaintenance(body, member.email);
    return NextResponse.json({ success: true, record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save maintenance record";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission("assets.maintenance");
    const body = await req.json();
    if (!body.id) throw new SheetError("Record ID is required.", 400);

    const updated = await patchRow("Asset_Maintenance", body.id, {
      status: body.status,
      completed_at: body.completed_at,
      cost: body.cost,
      notes: body.notes,
    });
    return NextResponse.json({ success: true, record: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update maintenance record";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

