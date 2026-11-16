import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { getSpreadsheetStatus, upgradeSpreadsheetStructure } from "@/lib/google-sheets";
import { errorStatus } from "@/lib/sheets/core";

export async function GET() {
  try {
    await requirePermission("system.manage");
    const status = await getSpreadsheetStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to inspect spreadsheet";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

export async function POST() {
  try {
    await requirePermission("system.manage");
    const result = await upgradeSpreadsheetStructure();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to upgrade Google Sheet structure";
    return NextResponse.json({ success: false, error: message }, { status: errorStatus(error) });
  }
}

