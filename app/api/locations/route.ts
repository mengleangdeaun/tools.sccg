import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { errorStatus, SheetError } from "@/lib/sheets/core";
import { appendRows, loadAll, patchRow } from "@/lib/sheets/table";
import { randomUUID } from "node:crypto";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { success: false, error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function GET() {
  try {
    await requirePermission("assets.view");
    const tabs = await loadAll();
    const locations = tabs.Asset_Locations.rows.filter((r) => !r.archived_at);
    return NextResponse.json({ success: true, locations });
  } catch (error: unknown) {
    return fail(error, "Failed to load locations");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("locations.manage");
    const body = await req.json();
    const name = text(body.name);
    if (!name) throw new SheetError("Location name is required.", 400);

    const live = (await loadAll()).Asset_Locations.rows.filter((r) => r.id && !r.archived_at);
    if (live.some((r) => r.name.trim().toLowerCase() === name.toLowerCase() && r.id !== body.id)) {
      throw new SheetError("A location with that name already exists.", 409);
    }

    const fields = {
      name,
      building: text(body.building),
      floor: text(body.floor),
      room: text(body.room),
      branch: text(body.branch),
    };

    if (body.id) {
      if (!live.some((r) => r.id === body.id)) throw new SheetError("That location was not found.", 404);
      await patchRow("Asset_Locations", body.id, fields);
      return NextResponse.json({ success: true, location: { id: body.id, ...fields } });
    }

    const record = { id: `LOC-${randomUUID().slice(0, 6).toUpperCase()}`, ...fields, archived_at: "" };
    await appendRows("Asset_Locations", [record]);
    return NextResponse.json({ success: true, location: record });
  } catch (error: unknown) {
    return fail(error, "Failed to save location");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("locations.manage");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new SheetError("Location ID is required.", 400);

    const inUse = (await loadAll()).Assets.rows.filter((r) => r.id && !r.archived_at && r.location_id === id).length;
    if (inUse > 0) {
      throw new SheetError(`${inUse} asset${inUse === 1 ? " is" : "s are"} at this location. Move ${inUse === 1 ? "it" : "them"} first.`, 409);
    }

    await patchRow("Asset_Locations", id, { archived_at: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to archive location");
  }
}
