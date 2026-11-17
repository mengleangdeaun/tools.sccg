import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { assertPermission, getCurrentMember, requirePermission } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/permissions";
import { errorStatus, SheetError } from "@/lib/sheets/core";
import { appendRows, loadAll, patchRow, updateWhere } from "@/lib/sheets/table";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { success: false, error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const key = (name: string) => name.trim().toLowerCase();
const newSupplierId = () => `SUP-${randomUUID().slice(0, 6).toUpperCase()}`;

export async function GET() {
  try {
    await requirePermission("assets.view");
    const suppliers = (await loadAll()).Asset_Suppliers.rows.filter((r) => r.id && !r.archived_at);
    return NextResponse.json({ success: true, suppliers });
  } catch (error: unknown) {
    return fail(error, "Failed to load suppliers");
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("action") === "import") return await importLegacyNames();

    const member = await getCurrentMember();
    const body = await req.json();
    const name = text(body.name);
    if (!name) throw new SheetError("Supplier name is required.", 400);
    const live = (await loadAll()).Asset_Suppliers.rows.filter((r) => r.id && !r.archived_at);

    // Anyone who can register assets may add a supplier by name from the Register form.
    if (!hasPermission(member, "suppliers.manage")) {
      assertPermission(member, "assets.create");
      if (body.id) throw new SheetError("You do not have permission to do this.", 403);
      const existing = live.find((r) => key(r.name) === key(name));
      if (existing) return NextResponse.json({ success: true, supplier: existing });
      const record = { id: newSupplierId(), name, contact_name: "", phone: "", email: "", address: "", notes: "", archived_at: "" };
      await appendRows("Asset_Suppliers", [record]);
      return NextResponse.json({ success: true, supplier: record });
    }

    if (live.some((r) => key(r.name) === key(name) && r.id !== body.id)) {
      throw new SheetError("A supplier with that name already exists.", 409);
    }

    const fields = {
      name,
      contact_name: text(body.contact_name),
      phone: text(body.phone),
      email: text(body.email),
      address: text(body.address),
      notes: text(body.notes),
    };

    if (body.id) {
      if (!live.some((r) => r.id === body.id)) throw new SheetError("That supplier was not found.", 404);
      await patchRow("Asset_Suppliers", body.id, fields);
      return NextResponse.json({ success: true, supplier: { id: body.id, ...fields } });
    }

    const record = { id: newSupplierId(), ...fields, archived_at: "" };
    await appendRows("Asset_Suppliers", [record]);
    return NextResponse.json({ success: true, supplier: record });
  } catch (error: unknown) {
    return fail(error, "Failed to save supplier");
  }
}

// Turns the old free-text "supplier" values on assets into supplier records and links those assets.
async function importLegacyNames() {
  await requirePermission("suppliers.manage");
  const tabs = await loadAll();
  const unlinked = (r: Record<string, string>) => r.id && !r.supplier_id && r.supplier?.trim();
  const names = new Map<string, string>();
  for (const r of tabs.Assets.rows) if (unlinked(r) && !names.has(key(r.supplier))) names.set(key(r.supplier), r.supplier.trim());

  const live = tabs.Asset_Suppliers.rows.filter((r) => r.id && !r.archived_at);
  const idFor = new Map(live.map((r) => [key(r.name), r.id]));
  const created = [...names].filter(([k]) => !idFor.has(k)).map(([k, name]) => {
    const record = { id: newSupplierId(), name, contact_name: "", phone: "", email: "", address: "", notes: "", archived_at: "" };
    idFor.set(k, record.id);
    return record;
  });
  if (created.length > 0) await appendRows("Asset_Suppliers", created);

  let linked = 0;
  for (const k of names.keys()) {
    linked += await updateWhere("Assets", (r) => !!unlinked(r) && key(r.supplier) === k, { supplier_id: idFor.get(k)! });
  }
  return NextResponse.json({ success: true, created: created.length, linked });
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("suppliers.manage");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new SheetError("Supplier ID is required.", 400);

    const inUse = (await loadAll()).Assets.rows.filter((r) => r.id && !r.archived_at && r.supplier_id === id).length;
    if (inUse > 0) {
      throw new SheetError(`${inUse} asset${inUse === 1 ? " is" : "s are"} linked to this supplier. Change ${inUse === 1 ? "its" : "their"} supplier first.`, 409);
    }

    await patchRow("Asset_Suppliers", id, { archived_at: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to archive supplier");
  }
}
