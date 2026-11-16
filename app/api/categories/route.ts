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

export async function GET() {
  try {
    await requirePermission("assets.view");
    const tabs = await loadAll();
    const categories = tabs.Asset_Categories.rows.filter((r) => !r.archived_at);
    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    return fail(error, "Failed to load categories");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("categories.manage");
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw new SheetError("Category name is required.", 400);

    const live = (await loadAll()).Asset_Categories.rows.filter((r) => r.id && !r.archived_at);
    if (live.some((r) => r.name.trim().toLowerCase() === name.toLowerCase() && r.id !== body.id)) {
      throw new SheetError("A category with that name already exists.", 409);
    }

    // Only the fields the form edits, so icon and sort_order keep their sheet values.
    const fields = {
      name,
      prefix: body.prefix?.trim() || "AST-",
      description: body.description?.trim() || "",
    };

    if (body.id) {
      if (!live.some((r) => r.id === body.id)) throw new SheetError("That category was not found.", 404);
      await patchRow("Asset_Categories", body.id, fields);
      return NextResponse.json({ success: true, category: { id: body.id, ...fields } });
    }

    const record = {
      id: `CAT-${randomUUID().slice(0, 6).toUpperCase()}`,
      ...fields,
      icon: "Box",
      sort_order: String(live.length + 1),
      archived_at: "",
    };
    await appendRows("Asset_Categories", [record]);
    return NextResponse.json({ success: true, category: record });
  } catch (error: unknown) {
    return fail(error, "Failed to save category");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("categories.manage");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new SheetError("Category ID is required.", 400);

    const inUse = (await loadAll()).Assets.rows.filter((r) => r.id && !r.archived_at && r.category_id === id).length;
    if (inUse > 0) {
      throw new SheetError(`${inUse} asset${inUse === 1 ? " uses" : "s use"} this category. Move ${inUse === 1 ? "it" : "them"} first.`, 409);
    }

    await patchRow("Asset_Categories", id, { archived_at: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to archive category");
  }
}
